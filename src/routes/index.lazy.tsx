import { createLazyFileRoute } from "@tanstack/react-router";
import { TestContract } from "../sway-api";
import contractIds from "../sway-api/contract-ids.json";
import { FuelLogo } from "../components/FuelLogo";
import { bn } from "fuels";
import { useState } from "react";
import { Link } from "../components/Link";
import { Button } from "../components/Button";
import toast from "react-hot-toast";
import { useActiveWallet } from "../hooks/useActiveWallet";
import useAsync from "react-use/lib/useAsync";
import {
    CURRENT_ENVIRONMENT,
    DOCS_URL,
    Environments,
    FAUCET_LINK,
    TESTNET_CONTRACT_ID,
} from "../lib";

export const Route = createLazyFileRoute("/")({
    component: Index,
});

const markets = [
    { title: 'Will Bitcoin hit $100k by 2025?', odds: { yes: 50, no: 50 }, volume: '5.2M USDC' },
    { title: 'Will AI replace 30% of jobs by 2030?', odds: { yes: 60, no: 40 }, volume: '2.8M USDC' },
    { title: 'Will SpaceX land humans on Mars by 2030?', odds: { yes: 70, no: 30 }, volume: '3.1M USDC' },
    // Add more markets here...
];
/* const contractId =
  CURRENT_ENVIRONMENT === Environments.LOCAL
    ? contractIds.testContract
    : TESTNET_CONTRACT_ID; // Testnet Contract ID
*/

function Index() {
    /* const { wallet, walletBalance, refreshWalletBalance } = useActiveWallet();
    const [contract, setContract] = useState<TestContract>();
    const [counter, setCounter] = useState<number>();
  
    /**
     * useAsync is a wrapper around useEffect that allows us to run asynchronous code
     * See: https://github.com/streamich/react-use/blob/master/docs/useAsync.md
     */ /*
useAsync(async () => {
if (wallet) {
// Create a new instance of the contract
const testContract = new TestContract(contractId, wallet);
setContract(testContract);
 
// Read the current value of the counter
const { value } = await testContract.functions.get_count().get();
setCounter(value.toNumber());
}
}, [wallet]); */

    /* const onIncrementPressed = async () => {
      if (!contract) {
        return toast.error("Contract not loaded");
      }
  
      if (walletBalance?.eq(0)) {
        return toast.error(
          <span>
            Your wallet does not have enough funds. Please top it up using the{" "}
            <Link href={FAUCET_LINK} target="_blank">
              faucet.
            </Link>
          </span>,
        );
      }
  
      // Call the increment_counter function on the contract
      const { waitForResult } = await contract.functions
        .increment_counter(bn(1))
        .call();
  
      // Wait for the transaction to be mined, and then read the value returned
      const { value } = await waitForResult();
  
      setCounter(value.toNumber());
  
      await refreshWalletBalance?.();
    }; */

    return (
        <>
            <FuelLogo />
            <h1 className="text-3xl font-bold">FuelCast <sup className="text-sm text-fuel-green/40">MVP</sup></h1>
            <section className="p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-6">Featured Markets</h2>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {markets.map((market, index) => (
                            <div
                                key={index}
                                className="border border-fuel-green/25 p-6 rounded-lg bg-fuel-green/10 hover:shadow-lg transition-shadow duration-300"
                            >
                                <h3 className="text-lg font-bold mb-4">{market.title}</h3>

                                {/* Odds with Progress Bars */}
                                <div className="mb-4">
                                    <div className="text-sm text-gray-300 mb-1">Odds:</div>

                                    <div className="w-full rounded-full h-6 relative mb-4">
                                        <div
                                            className="bg-blue-600 h-6 rounded-l-full text-xs text-white text-center relative"
                                            style={{ width: `${market.odds.yes}%` }}
                                        >
                                            <p className="absolute absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                Yes: {market.odds.yes}%
                                            </p>
                                        </div>
                                        <div
                                            className="bg-red-500 h-6 rounded-r-full text-xs text-white text-center absolute top-0"
                                            style={{ left: `${market.odds.yes}%`, width: `${market.odds.no}%` }}
                                        >
                                            <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                No: {market.odds.no}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Volume */}
                                <p className="text-sm text-gray-400 mb-4">Volume: {market.volume}</p>

                                {/* View Market Button */}
                                <button className="w-full bg-fuel-green text-white py-2 rounded-lg hover:bg-fuel-green/80 transition-colors duration-300">
                                    View Market
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
