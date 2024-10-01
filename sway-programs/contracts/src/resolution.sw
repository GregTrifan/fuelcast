contract;

use std::{
    auth::msg_sender,
    storage::StorageMap,
};
use market::Market;


abi Resolution {
    #[storage(read, write)]
    fn resolve_market(market_id: u64, outcome: bool); // True for Yes, False for No
}

storage {
    market_address: Option<ContractId> = None,  // Reference to the Market contract
}

impl Resolution for Contract {

    #[storage(write)]
    fn set_market_contract(id: ContractId) {
        storage.market_address.write(Some(id));
    }

    #[storage(read, write)]
    fn resolve(market_id: u64, outcome: bool) {
        let market_contract = abi(Market, storage.market_address.read().unwrap());
        
        // Call resolve_market on the Market contract
        market_contract.resolve_market(market_id, outcome);
    }
}
