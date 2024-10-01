contract;

use std::{
    auth::msg_sender,
    storage::StorageMap,
};

use orderbook::OrderBook;  
use resolution::Resolution; 

struct MarketBalance {
    yes_balance: u64,
    no_balance: u64,
}

struct MarketInfo {
    question: str[100],
    resolution_time: u64,
    resolved: bool,
    outcome: Option<bool>,
    yes_pool: u64,
    no_pool: u64,
}

abi Market {
    #[storage(read, write)]
    fn create_market(question: str[100], resolution_time: u64) -> u64;

    #[storage(read, write)]
    fn deposit_tokens(market_id: u64, is_yes: bool, amount: u64);

    #[storage(read, write)]
    fn withdraw_earnings(market_id: u64);

    #[storage(read, write)]
    fn transfer_tokens(market_id: u64, is_yes: bool, from: Identity, to: Identity, amount: u64);

    #[storage(read)]
    fn get_market_info(market_id: u64) -> MarketInfo;

    #[storage(read)]
    fn get_user_balance(market_id: u64, user: Identity) -> MarketBalance;

    #[storage(write)]
    fn set_orderbook_contract(id: ContractId);

    #[storage(write)]
    fn set_resolution_contract(id: ContractId);

    #[storage(read)]
    fn get_orderbook_contract() -> ContractId;

    #[storage(read)]
    fn get_resolution_contract() -> ContractId;

    #[storage(read, write)]
    fn resolve(market_id: u64, outcome: bool);
}

storage {
    markets: StorageMap<u64, MarketInfo> = StorageMap {},
    balances: StorageMap<(u64, Identity), MarketBalance> = StorageMap {},
    market_count: u64 = 0,
    orderbook_contract: Option<ContractId> = None,
    resolution_contract: Option<ContractId> = None,
}

impl Market for Contract {
    #[storage(read, write)]
    fn create_market(question: str[100], resolution_time: u64) -> u64 {
        let market_id = storage.market_count;
        storage.market_count += 1;

        let market_info = MarketInfo {
            question,
            resolution_time,
            resolved: false,
            outcome: None,
            yes_pool: 0,
            no_pool: 0,
        };

        storage.markets.insert(market_id, market_info);
        market_id
    }

    #[storage(read, write)]
    fn deposit_tokens(market_id: u64, is_yes: bool, amount: u64) {
        let user = msg_sender().unwrap();
        let mut market = storage.markets.get(market_id).unwrap();
        let mut balance = storage.balances.get((market_id, user)).unwrap_or(MarketBalance {
            yes_balance: 0,
            no_balance: 0,
        });

        if is_yes {
            market.yes_pool += amount;
            balance.yes_balance += amount;
        } else {
            market.no_pool += amount;
            balance.no_balance += amount;
        }

        storage.markets.insert(market_id, market);
        storage.balances.insert((market_id, user), balance);
    }

    #[storage(read, write)]
    fn withdraw_earnings(market_id: u64) {
        let user = msg_sender().unwrap();
        let market = storage.markets.get(market_id).unwrap();
        let balance = storage.balances.get((market_id, user)).unwrap();

        if !market.resolved {
            revert(0); // Market not resolved yet
        }

        let winnings = if market.outcome.unwrap() {
            balance.yes_balance
        } else {
            balance.no_balance
        };

        if winnings == 0 {
            revert(1); // No winnings to withdraw
        }

        storage.balances.insert((market_id, user), MarketBalance {
            yes_balance: 0,
            no_balance: 0,
        });

        // Transfer winnings to the user (implementation for actual token transfer needed)
    }

    #[storage(read, write)]
    fn transfer_tokens(market_id: u64, is_yes: bool, from: Identity, to: Identity, amount: u64) {
        let mut from_balance = storage.balances.get((market_id, from)).unwrap();
        let mut to_balance = storage.balances.get((market_id, to)).unwrap_or(MarketBalance {
            yes_balance: 0,
            no_balance: 0,
        });

        if is_yes {
            if from_balance.yes_balance < amount {
                revert(2); // Insufficient Yes balance
            }
            from_balance.yes_balance -= amount;
            to_balance.yes_balance += amount;
        } else {
            if from_balance.no_balance < amount {
                revert(3); // Insufficient No balance
            }
            from_balance.no_balance -= amount;
            to_balance.no_balance += amount;
        }

        storage.balances.insert((market_id, from), from_balance);
        storage.balances.insert((market_id, to), to_balance);
    }

    #[storage(read)]
    fn get_market_info(market_id: u64) -> MarketInfo {
        storage.markets.get(market_id).unwrap()
    }

    #[storage(read)]
    fn get_user_balance(market_id: u64, user: Identity) -> MarketBalance {
        storage.balances.get((market_id, user)).unwrap_or(MarketBalance {
            yes_balance: 0,
            no_balance: 0,
        })
    }

    #[storage(write)]
    fn set_orderbook_contract(id: ContractId) {
        storage.orderbook_contract.write(Some(id));
    }

    #[storage(write)]
    fn set_resolution_contract(id: ContractId) {
        storage.resolution_contract.write(Some(id));
    }
    
    #[storage(read)]
    fn get_orderbook_contract() -> ContractId {
        storage.orderbook_contract.read().unwrap()
    }

    #[storage(read)]
    fn get_resolution_contract() -> ContractId {
        storage.resolution_contract.read().unwrap()
    }

    #[storage(read, write)]
    fn resolve(market_id: u64, outcome: bool) {
        let sender = msg_sender().unwrap();
        if let Identity::Address(addr) = sender {
            let resolution_contract_id = storage.resolution_contract.read().unwrap();
            assert(addr == resolution_contract_id); // Only the resolution contract can resolve the market
        } else {
            revert(0);
        }

        let mut market_info = storage.markets.get(market_id).unwrap();
        if market_info.resolved {
            revert(1); // Market already resolved
        }

        market_info.outcome = Some(outcome);
        market_info.resolved = true;

        storage.markets.insert(market_id, market_info);
    }
}
