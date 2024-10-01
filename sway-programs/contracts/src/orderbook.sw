contract;

use std::{
    auth::msg_sender,
    storage::StorageMap,
};

struct Order {
    trader: Identity,
    amount: u64,
    price: u64,
    is_yes: bool,
}

abi OrderBook {
    #[storage(read, write)]
    fn place_order(market_id: u64, is_buy: bool, is_yes: bool, amount: u64, price: u64);

    #[storage(read)]
    fn get_order_book(market_id: u64) -> (Vec<Order>, Vec<Order>);
}

storage {
    buy_orders: StorageMap<u64, Vec<Order>> = StorageMap {},
    sell_orders: StorageMap<u64, Vec<Order>> = StorageMap {},
    market_address: Option<ContractId> = None,
}

impl OrderBook for Contract {
    #[storage(read, write)]
    fn place_order(market_id: u64, is_buy: bool, is_yes: bool, amount: u64, price: u64) {
        let market_contract = abi(Market, storage.market_address.read().unwrap());
        let market_info = market_contract.get_market_info(market_id);

        if market_info.resolved {
            revert(0); // Revert if the market has been resolved
        }

        let trader = msg_sender().unwrap();
        let order = Order { trader, amount, price, is_yes };

        if is_buy {
            let mut orders = storage.buy_orders.get(market_id).unwrap_or(Vec::new());
            orders.push(order);
            orders.sort_by(|a, b| b.price.cmp(&a.price));
            storage.buy_orders.insert(market_id, orders);
        } else {
            let mut orders = storage.sell_orders.get(market_id).unwrap_or(Vec::new());
            orders.push(order);
            orders.sort_by(|a, b| a.price.cmp(&b.price));
            storage.sell_orders.insert(market_id, orders);
        }

        match_orders(market_id);
    }

    #[storage(read)]
    fn get_order_book(market_id: u64) -> (Vec<Order>, Vec<Order>) {
        let buy_orders = storage.buy_orders.get(market_id).unwrap_or(Vec::new());
        let sell_orders = storage.sell_orders.get(market_id).unwrap_or(Vec::new());
        (buy_orders, sell_orders)
    }
}

fn match_orders(market_id: u64) {
    let mut buy_orders = storage.buy_orders.get(market_id).unwrap_or(Vec::new());
    let mut sell_orders = storage.sell_orders.get(market_id).unwrap_or(Vec::new());

    let mut i = 0;
    let mut j = 0;

    while i < buy_orders.len() && j < sell_orders.len() {
        let buy_order = &mut buy_orders[i];
        let sell_order = &mut sell_orders[j];

        if buy_order.price >= sell_order.price && buy_order.is_yes == sell_order.is_yes {
            let matched_amount = u64::min(buy_order.amount, sell_order.amount);
            let market_contract = abi(Market, storage.market_address.read().unwrap());

            market_contract.transfer_tokens(market_id, buy_order.is_yes, sell_order.trader, buy_order.trader, matched_amount);

            buy_order.amount -= matched_amount;
            sell_order.amount -= matched_amount;

            if buy_order.amount == 0 { i += 1; }
            if sell_order.amount == 0 { j += 1; }
        } else {
            break;
        }
    }

    storage.buy_orders.insert(market_id, buy_orders);
    storage.sell_orders.insert(market_id, sell_orders);
}
