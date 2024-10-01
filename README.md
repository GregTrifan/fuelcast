# FuelCast

This is a [Vite](https://vitejs.dev/) project bootstrapped with [`create-fuels`](https://github.com/FuelLabs/fuels-ts/tree/master/packages/create-fuels).

## Overview

FuelCast makes trading in prediction markets super easy. You can create markets for anything—from sports games to elections—and trade on what you think will happen. The PoC has three main contracts: **Market**, **OrderBook**, and **Resolution**.

## Contracts

### Market Contract

The **Market Contract** is where everything starts. Here’s what it handles:

- **Create Markets:** You can start your own prediction markets and set your own questions and timeframes.
- **Token Management:** Deposit tokens to trade or withdraw them when you’re done.
- **Balance Tracking:** Keeps an eye on your token balance so you always know what you can trade with.

### OrderBook Contract

This is where you place your buy and sell orders:

- **Place Orders:** You can easily buy or sell by placing your orders in the order book.
- **Order Matching:** The system automatically matches buy and sell orders, so you can trade even if the amounts and prices don’t exactly match.

### Resolution Contract

This one handles the outcomes:

- **Resolve Markets:** Once a market closes, this contract figures out what happened based on user predictions.
- **Fair Outcomes:** It makes sure the results are trustworthy and follow the rules set during market creation.

## Diagram

This is how things are working overall [FuelCast Diagram](https://excalidraw.com/#json=zpqd1ejNK2_ILbINsjBaf,BQNGTe9a9mZBNZIWGdVgDw)

#### What's left to build for a proper MVP

- Tests, tests, TESTS!!
- Buidling the UI
- Dispute resolution contracts
- Setting up oracles for automated resolutions
- ERC1155-like tokens for handling Y/N ownership
