# Quick Start: Borrowing Assets from the Compound Protocol

Examples for borrowing Ethereum assets to the [Compound Protocol](https://compound.finance/?ref=github&user=ajb413&repo=compound-borrow-examples).

If you want to borrow assets directly from the protocol from your Ethereum wallet using JSON RPC and Web3.js, see the `web3-js-examples` folder. JSON RPC can be utilized in the **web browser or with Node.js**.

If you want to borrow assets from the protocol from your Ethereum smart contract, see the `solidity-examples` folder.

## What is Compound?
Compound is an open-source, autonomous protocol built for developers, to unlock a universe of new financial applications. Interest and borrowing, for the open financial system. Learn more on the website:

<a href="https://compound.finance/?ref=github&user=ajb413&repo=compound-supply-examples">
    <img alt="Compound Finance" src="https://raw.githubusercontent.com/ajb413/compound-interest-alerts/master/compound-finance-logo.png" width=260 height=60/>
</a>

## Setup
The code in this repository can be used to borrow assets from Compound on the main net, any public test net, or your own localhost with [Ganache CLI](https://github.com/trufflesuite/ganache-cli).

If you haven't already, install [Node.js](https://nodejs.org/) LTS. Clone this repository, `cd` to the root directory of the project, and run:
```bash
npm install
```

If you want to use the script examples in the **web browser**, you'll need to first import web3.js in your HTML file using the following line. You'll also need to import the JS example files into your HTML. This step is **not necessary** if you are running the examples with only Node.js.
```html
<script src="https://cdn.jsdelivr.net/npm/web3@1.2.6/dist/web3.min.js"></script>
```

### Running a Local Ethereum Test Net with Ganache CLI
To get the localhost test net running, use the following commands in a second command line window. The command runs Ganache CLI and forks the Main Ethereum network to your machine via Cloudflare. If you want to access a test network like Ropsten, you can replace the `-f` value with your [Infura](https://infura.io/) endpoint with your API key (something like `https://kovan.infura.io/v3/<YOUR INFURA API KEY HERE>`).
```bash
cd compound-supply-examples/

## Run a fork of main net locally using Ganache CLI
./node_modules/.bin/ganache-cli \
  -f https://cloudflare-eth.com/ \
  -m "clutch captain shoe salt awake harvest setup primary inmate ugly among become" \
  -i 999 \
  -u 0x9759A6Ac90977b93B58547b4A71c78317f391A28
```

- `-f` Forks the Main Ethereum network to your local machine for development and testing.
- `-m` Runs Ganache with an Ethereum key set based on the mnemonic passed. The first 10 addresses have 100 test ETH in their balance on the local test net every time you boot Ganache. **Do not use this mnemonic anywhere other than your localhost test net.**
- `-i` Sets an explicit network ID to avoid confusion and errors.
- `-u` Unlocks an address so you can write to your localhost test blockchain without knowing that address's private key. We are unlocking the above address so we can mint our own test DAI on our localhost test net. The address for minting DAI changes occasionally (see **Minting Test DAI** section below for updating).

## Borrowing Assets Directly via Web3 JSON RPC
These code examples can be run by a web browser or with Node.js. If you want to use a web browser, you'll need to import the web3.js script in your HTML or JS file (see import above).

Running these scripts will give your wallet borrowed **ETH** and **DAI**. cTokens are ERC20 Tokens that can be **used to redeem an ever-increasing amount of the underlying asset**. The cToken exchange rate **increases every Ethereum block**, they can be transferred, and can be used to redeem at any time, as long as it does not put your borrowing account under water.

### Localhost Test Net
- Run your local test net in a second command line window **using the command above**.
- If you are using DAI as collateral (an ERC20 token example), you need to **first** mint some for your wallet using `node mint-testnet-dai.js`. You may need to update the DAI main net contract address and the `MCD_JOIN_DAI` address in the script. This changes periodically as DAI is improved (see **Minting Test DAI** section below for updating).
- `cd web3-js-examples/`
- `node supply-eth-via-json-rpc.js` To supply ETH.
- `node supply-erc20-via-json-rpc.js` To supply some DAI. The same code can be used for any other [ERC20 token that Compound supports](https://compound.finance/markets?ref=github&user=ajb413&repo=compound-supply-examples).

### Public Test Net or Main Net
- Make sure you have a wallet with ETH for the Ethereum network you plan to interface with (Main, Ropsten, Kovan, etc.).
- Insert the private key of your wallet in the scripts where noted. It's a best practice to insert the private key using an environment variable instead of revealing it in the code with a string literal.
- Replace the HTTP provider in the `web3` constructors in the scripts in `web3-js-examples/`. Replace it using the string provided by the "Endpoint" selector in your Infura project dashboard. The local test net provider is `http://127.0.0.1:8545`.
- Next, replace the contract addresses in the JSON file with the most recent ones. You can find Compound's cToken contract addresses for each network on this page: [https://compound.finance/developers#networks](https://compound.finance/developers#networks). The DAI contract address can be found in the Maker DAO website change logs [https://changelog.makerdao.com/](https://changelog.makerdao.com/).

## Borrowing Assets via Solidity Smart Contracts
Running these scripts will give your contract address **ETH** and **DAI**. cTokens are ERC20 Tokens that can be **used to redeem an ever-increasing amount of the underlying asset**. The cToken exchange rate **increases every Ethereum block**, they can be transferred, and can be used to redeem at any time, as long as it does not put your borrowing account under water.

### Localhost Test Net
- Run your local test net in a second command line window **using the command above**.
- If supplying DAI (an ERC20 token example) as collateral, you need to **first** mint some for your wallet using `node mint-testnet-dai.js`. You may need to update the DAI main net contract address and the `MCD_JOIN_DAI` address in the script. This changes periodically as DAI is improved (see **Minting Test DAI** section below for updating).
- `node compile-smart-contracts.js` This will compile the Solidity code in `solidity-examples/`. The build output is written to `.build/`.
- `node deploy-smart-contracts.js`.
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
My Wallet's  ETH Balance: 100
My Wallet's cETH Balance: 0
My Wallet's  DAI Balance: 0

Supplying ETH to Compound as collateral (you will get cETH in return)...

My Wallet's  ETH Balance: 98.9978876
My Wallet's cETH Balance: 49.97131893
My Wallet's  DAI Balance: 0

Entering market (via Comptroller contract) for ETH (as collateral)...
Calculating your liquid assets in Compound...
Fetching cETH collateral factor...
Fetching DAI price from the price oracle...
Fetching borrow rate per block for DAI borrowing...

You have 0.749999999913076963 of LIQUID assets (worth of ETH) pooled in Compound.
You can borrow up to 75% of your TOTAL assets supplied to Compound as DAI.
1 DAI == 0.004205 ETH
You can borrow up to 178.3599922379794 DAI from Compound.
NEVER borrow near the maximum amount because your account will be instantly liquidated.

Your borrowed amount INCREASES (3.8729687868e-8 * borrowed amount) DAI per block.
This is based on the current borrow rate.

Now attempting to borrow 50 DAI...
My Wallet's  ETH Balance: 98.98883272
My Wallet's cETH Balance: 49.97131893
My Wallet's  DAI Balance: 50

Fetching DAI borrow balance from cDAI contract...
Borrow balance is 50 DAI

This part is when you do something with those borrowed assets!

Now repaying the borrow...
Approving DAI to be transferred from your wallet to the cDAI contract...

Borrow repaid.

My Wallet's  ETH Balance: 98.98353318
My Wallet's cETH Balance: 49.97131893
My Wallet's  DAI Balance: 0

```
</p>
</details>

**Borrow ETH via Web3 JavaScript**

<details><summary>Output Example</summary>
<p>

```
My Wallet's  ETH Balance: 100
My Wallet's cDAI Balance: 0
My Wallet's  DAI Balance: 500

Approving DAI to be transferred from your wallet to the cDAI contract...

Supplying DAI to Compound as collateral (you will get cDAI in return)...

My Wallet's  ETH Balance: 99.99413216
My Wallet's cDAI Balance: 738.43696251
My Wallet's  DAI Balance: 485

Entering market (via Comptroller contract) for ETH (as collateral)...
Calculating your liquid assets in Compound...
Fetching Compound's DAI collateral factor...
Fetching DAI price from the price oracle...
Fetching borrow rate per block for ETH borrowing...

You have 0.047306012369014631 of LIQUID assets (worth of ETH) pooled in Compound.
You can borrow up to 75% of your TOTAL assets supplied to Compound as ETH.
1 DAI == 0.004205 ETH
You can borrow up to 0.047306012369014631 ETH from Compound.
NEVER borrow near the maximum amount because your account will be instantly liquidated.

Your borrowed amount INCREASES (9.667017768e-9 * borrowed amount) ETH per block.
This is based on the current borrow rate.

Now attempting to borrow 0.02 ETH...
My Wallet's  ETH Balance: 100.00848898
My Wallet's cDAI Balance: 738.43696251
My Wallet's  DAI Balance: 485

Fetching your ETH borrow balance from cETH contract...
Borrow balance is 0.02 ETH

This part is when you do something with those borrowed assets!

Now repaying the borrow...

Borrow repaid.

My Wallet's  ETH Balance: 99.98644126
My Wallet's cDAI Balance: 738.43696251
My Wallet's  DAI Balance: 485
```
</p>
</details>

**Borrow ERC20 via Solidity**

<details><summary>Output Example</summary>
<p>

```
My Wallet's   ETH Balance: 99.97418948
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0

Calling MyContract.borrowErc20Example with 1 ETH for collateral...

My Wallet's   ETH Balance: 98.9607079
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 49.97124348
MyContract's  DAI Balance: 10

Now repaying the borrow...

My Wallet's   ETH Balance: 98.95576444
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 49.97124348
MyContract's  DAI Balance: 0
```
</p>
</details>

**Borrow ETH Token via Solidity**

<details><summary>Output Example</summary>
<p>

```
My Wallet's   DAI Balance: 500
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 0

Sending 15 DAI to MyContract so it can provide collateral...

My Wallet's   DAI Balance: 485
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 15
MyContract's cDAI Balance: 0

Calling MyContract.borrowEthExample with 15 DAI for collateral...

My Wallet's   DAI Balance: 485
MyContract's  ETH Balance: 0.02
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 737.03979461

Now repaying the borrow...

My Wallet's   DAI Balance: 485
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 737.03979461
```
</p>
</details>

## Minting Test DAI
To mint some DAI for your test network, you must use the **Join DAI** address. This can be unlocked when running Ganache CLI. You'll need to update the Join DAI address and the contract address each time the DAI contracts are updated. 

The contract address can be found at [https://changelog.makerdao.com/](https://changelog.makerdao.com/).

- Click the latest production release.
- Click contract addresses.
- The main net DAI contract address is in the JSON value of the `MCD_DAI` key.
- The Join DAI address is in the `MCD_JOIN_DAI` key.

Once you're certain you have the latest DAI and Join DAI address:

- Run Ganache CLI using the command above with `-u` and the Join DAI address.
- Paste the new addresses in `mint-testnet-dai.js` and save.
- Run `node mint-testnet-dai.js`.
