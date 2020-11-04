# Quick Start: Borrowing Assets from the Compound Protocol

Examples for borrowing Ethereum assets from the [Compound Protocol](https://compound.finance/?ref=github&user=ajb413&repo=compound-borrow-examples).

**[Full Quick Start Tutorial on the Compound Medium Blog](https://medium.com/compound-finance/borrowing-assets-from-compound-quick-start-guide-f5e69af4b8f4)** 

If you want to borrow assets directly from the protocol from your Ethereum wallet using JSON RPC and Web3.js, see the `web3-js-examples` folder. JSON RPC can be utilized in the **web browser or with Node.js**.

If you want to borrow assets from the protocol from your Ethereum smart contract, see the `solidity-examples` folder.

## What is Compound?
Compound is an open-source, autonomous protocol built for developers, to unlock a universe of new financial applications. Interest and borrowing, for the open financial system. Learn more on the website:

<a href="https://compound.finance/?ref=github&user=ajb413&repo=compound-supply-examples">
    <img alt="Compound Finance" src="https://raw.githubusercontent.com/ajb413/compound-interest-alerts/master/compound-finance-logo.png" width=260 height=60/>
</a>

## Setup
The code in this repository can be used to borrow assets from Compound on the Ethereum mainnet, any public test net, or your own localhost with [Ganache CLI](https://github.com/trufflesuite/ganache-cli).

If you haven't already, install [Node.js](https://nodejs.org/) LTS. Clone this repository, `cd` to the root directory of the project, and run:
```bash
git clone git@github.com:compound-developers/compound-borrow-examples.git
cd compound-borrow-examples/
npm install
```

We'll need `npx` for this project. If you don't have `npx`, install it using this command:
```bash
npm install -g npx
```

If you want to use the script examples in the **web browser**, you'll need to first import web3.js in your HTML file using the following line. You'll also need to import the JS example files into your HTML. This step is **not necessary** if you are running the examples with only Node.js.
```html
<script src="https://cdn.jsdelivr.net/npm/web3@1.2.6/dist/web3.min.js"></script>
```

### Running a Local Ethereum Test Net with Ganache CLI
To get the localhost test net running, use the following commands in a second command line window. The command runs Ganache CLI and forks the Main Ethereum network to your machine.

**If you are not running your own Ethereum node, make an [Infura](https://infura.io/) account at [https://infura.io/](https://infura.io/).** Accounts are free. Get a **project ID** and supplant it into the terminal command below.

```bash
cd compound-borrow-examples/

## Run a fork of Mainnet locally using Ganache CLI
npx ganache-cli \
  -f https://mainnet.infura.io/v3/<YOUR INFURA API KEY HERE> \
  -m "clutch captain shoe salt awake harvest setup primary inmate ugly among become" \
  -i 1 \
  -u 0x9759A6Ac90977b93B58547b4A71c78317f391A28
```

- `-f` Forks the Main Ethereum network to your local machine for development and testing.
- `-m` Runs Ganache with an Ethereum key set based on the mnemonic passed. The first 10 addresses have 100 test ETH in their balance on the local test net every time you boot Ganache. **Do not use this mnemonic anywhere other than your localhost test net.**
- `-i` Sets an explicit network ID to avoid confusion and errors.
- `-u` Unlocks an address so you can write to your localhost test blockchain without knowing that address's private key. We are unlocking the above address so we can mint our own test DAI on our localhost test net. The address for minting DAI changes occasionally (see **Minting Localhost Test DAI** section below for updating).

## Borrowing Assets Directly via Web3 JSON RPC
These code examples can be run by a web browser or with Node.js. If you want to use a web browser, you'll need to import the web3.js script in your HTML or JS file (see import above).

Running these scripts will give your wallet borrowed **ETH** and **DAI**. cTokens are ERC20 Tokens that can be **used to redeem an ever-increasing amount of the underlying asset**. The cToken exchange rate **increases every Ethereum block**, they can be transferred, and can be used to redeem at any time, as long as it does not put your borrowing account under water.

### Localhost Test Net
- Run your local testnet in a second command line window **using the command above**.
- If supplying DAI (an ERC20 token example) as collateral, you need to **first** mint some for your wallet using `node seed-account-with-erc20/dai.js`. You may need to update the DAI main net contract address and the `MCD_JOIN_DAI` address in the script. This changes periodically as DAI is improved (see **Minting Localhost Test DAI** section below for updating).
- `node compile-smart-contracts.js` This will compile the Solidity code in `solidity-examples/`. The build output is written to `.build/`
- `node deploy-smart-contracts.js`
- `cd solidity-examples/`
- `node borrow-erc20-with-eth-collateral.js` To borrow DAI with ETH.
- `node borrow-eth-with-erc20-collateral.js` To borrow ETH with DAI.

### Public Test Net or Main Net
- Make sure you have a wallet with ETH for the Ethereum network you plan to interface with (Main, Ropsten, Kovan, etc.).
- Insert the private key of your wallet in the scripts where noted. It's a best practice to insert the private key using an environment variable instead of revealing it in the code with a string literal.
- Replace the HTTP provider in the `web3` constructors in the JS scripts in `solidity-examples/`. Replace it using the string provided by the "Endpoint" selector in your Infura project dashboard. The local test net provider is `http://127.0.0.1:8545`.
- Next, replace the contract addresses in the JSON file with the most recent ones. You can find Compound's cToken contract addresses for each network on this page: [https://compound.finance/developers#networks](https://compound.finance/developers#networks). The DAI contract address can be found in the Maker DAO website change logs [https://changelog.makerdao.com/](https://changelog.makerdao.com/).

## Output Examples

**Borrow ERC20 via Web3 JavaScript**

<details><summary>Output Example</summary>
<p>

```
node web3-js-examples/borrow-erc20-with-eth-collateral.js
My Wallet's  ETH Balance: 100
My Wallet's cETH Balance: 0
My Wallet's  DAI Balance: 0.000200882723749888

Supplying ETH to the protocol as collateral (you will get cETH in return)...

My Wallet's  ETH Balance: 98.9975322
My Wallet's cETH Balance: 49.9302679
My Wallet's  DAI Balance: 0.000200882723749888

Entering market (via Comptroller contract) for ETH (as collateral)...
Calculating your liquid assets in the protocol...
Fetching cETH collateral factor...
Fetching DAI price from the price feed...
Fetching borrow rate per block for DAI borrowing...

You have 287.9287499590705 of LIQUID assets (worth of USD) pooled in the protocol.
You can borrow up to 75% of your TOTAL collateral supplied to the protocol as DAI.
1 DAI == 1.009985 USD
You can borrow up to 285.0822041506265 DAI from the protocol.
NEVER borrow near the maximum amount because your account will be instantly liquidated.

Your borrowed amount INCREASES (1.888700297e-8 * borrowed amount) DAI per block.
This is based on the current borrow rate.

Now attempting to borrow 50 DAI...
My Wallet's  ETH Balance: 98.98930958
My Wallet's cETH Balance: 49.9302679
My Wallet's  DAI Balance: 50.00020088272375

Fetching DAI borrow balance from cDAI contract...
Borrow balance is 50 DAI

This part is when you do something with those borrowed assets!

Now repaying the borrow...
Approving DAI to be transferred from your wallet to the cDAI contract...

Borrow repaid.

My Wallet's  ETH Balance: 98.98283472
My Wallet's cETH Balance: 49.9302679
My Wallet's  DAI Balance: 0.000200882723749888

```
</p>
</details>

**Borrow ETH via Web3 JavaScript**

<details><summary>Output Example</summary>
<p>

```
node web3-js-examples/borrow-eth-with-erc20-collateral.js
My Wallet's  ETH Balance: 98.98283472
My Wallet's cDAI Balance: 0
My Wallet's  DAI Balance: 50.00020088272375

Approving DAI to be transferred from your wallet to the cDAI contract...

Supplying DAI to the protocol as collateral (you will get cDAI in return)...

My Wallet's  ETH Balance: 98.97617056
My Wallet's cDAI Balance: 723.03067199
My Wallet's  DAI Balance: 35.00020088272375

Entering market (via Comptroller contract) for ETH (as collateral)...
Calculating your liquid assets in the protocol...
Fetching the protocol's DAI collateral factor...
Fetching DAI price from the price feed...
Fetching borrow rate per block for ETH borrowing...

You have 299.291079301354028695 of LIQUID assets (worth of USD) pooled in the protocol.
You can borrow up to 75% of your TOTAL assets supplied to the protocol as ETH.
1 DAI == 1.009985 USD
You can borrow up to 299.291079301354028695 USD worth of assets from the protocol.
NEVER borrow near the maximum amount because your account will be instantly liquidated.

Your borrowed amount INCREASES (1.2222654221e-8 * borrowed amount) ETH per block.
This is based on the current borrow rate.

Now attempting to borrow 0.02 ETH...

ETH borrow successful.

My Wallet's  ETH Balance: 98.99167388
My Wallet's cDAI Balance: 723.03067199
My Wallet's  DAI Balance: 35.00020088272375

Fetching your ETH borrow balance from cETH contract...
Borrow balance is 0.02 ETH

This part is when you do something with those borrowed assets!

Now repaying the borrow...

Borrow repaid.

My Wallet's  ETH Balance: 98.96883582
My Wallet's cDAI Balance: 723.03067199
My Wallet's  DAI Balance: 35.00020088272375

```
</p>
</details>

**Borrow ERC20 via Solidity**

<details><summary>Output Example</summary>
<p>

```
node solidity-examples/borrow-erc20-via-solidity.js
My Wallet's   ETH Balance: 99.97413128
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0

Calling MyContract.borrowErc20Example with 1 ETH for collateral...

My Wallet's   ETH Balance: 98.96193916
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 49.9302674
MyContract's  DAI Balance: 10

Now repaying the borrow...

My Wallet's   ETH Balance: 98.95618962
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 49.9302674
MyContract's  DAI Balance: 0
```
</p>
</details>

**Borrow ETH Token via Solidity**

<details><summary>Output Example</summary>
<p>

```
node solidity-examples/borrow-eth-via-solidity.js
My Wallet's   DAI Balance: 50.00020088272375
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 0

Sending 25 DAI to MyContract so it can provide collateral...

My Wallet's   DAI Balance: 25.00020088272375
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 25
MyContract's cDAI Balance: 0

Calling MyContract.borrowEthExample with 25 DAI as collateral...

My Wallet's   DAI Balance: 25.00020088272375
MyContract's  ETH Balance: 0.02
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 1205.0508796

Now repaying the borrow...

My Wallet's   DAI Balance: 25.00020088272375
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 1205.0508796

```
</p>
</details>

## Minting Localhost Test DAI
To mint some DAI for your localhost test network, you must use the **Join DAI** address. This can be unlocked when running Ganache CLI. You'll need to update the Join DAI address and the contract address each time the DAI contracts are updated. 

The contract address can be found at [https://changelog.makerdao.com/](https://changelog.makerdao.com/).

- Click the latest production release.
- Click contract addresses.
- The Mainnet DAI contract address is in the JSON value of the `MCD_DAI` key.
- The Join DAI address is in the `MCD_JOIN_DAI` key.

Once you're certain you have the latest DAI and Join DAI address:

- Run Ganache CLI using the command above with `-u` and the Join DAI address.
- Paste the new addresses in `node seed-account-with-erc20/dai.js` and save.
- Run `node seed-account-with-erc20/dai.js`
- See the other scripts in the `seed-account-with-erc20` folder and the addresses to unlock in order to seed the wallet with other supported ERC-20s.
