# Quick Start: Borrowing Assets from the Compound Protocol

Examples for borrowing Ethereum assets from the [Compound Protocol](https://compound.finance/?ref=github&user=ajb413&repo=compound-borrow-examples).

**[Full Quick Start Tutorial on the Compound Medium Blog](https://medium.com/compound-finance/borrowing-assets-from-compound-quick-start-guide-f5e69af4b8f4)** 

If you want to borrow assets directly from the protocol from your Ethereum wallet using JSON RPC and Web3.js, see the `examples-js` folder. There are examples for popular web3 libraries like **Web3.js**, **Ethers.js**, and **Compound.js**.

JSON RPC can be utilized in the **web browser, with Node.js, or any other programming language with a web3 library**.

If you want to borrow assets from the protocol from your Ethereum smart contract, see the `examples-solidity` folder.


## What is Compound?
Compound is an open-source, autonomous protocol built for developers, to unlock a universe of new financial applications. Interest and borrowing, for the open financial system. Learn more on the website:

<a href="https://compound.finance/?ref=github&user=ajb413&repo=compound-supply-examples">
    <img alt="Compound Finance" src="https://raw.githubusercontent.com/ajb413/compound-interest-alerts/master/compound-finance-logo.png" width=260 height=60/>
</a>

## Setup
The code in this repository can be used to borrow assets from Compound on the Ethereum mainnet, any public test net, or your own localhost with [Hardhat](https://hardhat.org/getting-started/).

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

If you want to use the JS examples in the **web browser**, you'll need to first import your web3 library of choice into your HTML (Web3.js, Ethers.js, or Compound.js). This step is **not necessary** if you are running the examples with only Node.js.

### Running a Local Ethereum Testnet with Hardhat
To get the localhost testnet running, use the following commands in a second command line window. The command runs a local Hardhat node and forks Ethereum Mainnet to your machine.

**If you are not running your own Ethereum node, make an [Infura](https://infura.io/) account at [https://infura.io/](https://infura.io/) or at [Alchemy.com](https://alchemy.com).** Accounts are free. Get a **project ID** and supplant it into your [environment variable settings](https://www.twilio.com/blog/2017/01/how-to-set-environment-variables.html), like below.

```bash
cd compound-supply-examples/

## Set environment variables for the script to use
export MAINNET_PROVIDER_URL="https://mainnet.infura.io/v3/<YOUR INFURA API KEY HERE>"
export DEV_ETH_MNEMONIC="clutch captain shoe salt awake harvest setup primary inmate ugly among become"

## Runs the Hardhat node locally
## Also seeds your first mnemonic account with test Ether and ERC20s
node ./scripts/run-localhost-fork.js
```

## Borrowing Assets Directly via Web3 JSON RPC
These code examples can be run by a web browser or with Node.js. If you want to use a web browser, you'll need to import a library in your HTML or JS file.

Running these scripts will give your wallet borrowed **ETH** and **Dai**. cTokens are ERC20 Tokens that can be **used to redeem an ever-increasing amount of the underlying asset**. The cToken exchange rate **increases every Ethereum block**, they can be transferred, and can be used to redeem at any time, as long as the underlying collateral does not support an open borrow.

### Localhost Test Net
- Run your local testnet in a second command line window **using the command above**. This will seed your account with ERC20 tokens. Look at the script file to find other ERC20 tokens that can be seeded into the account.
- `node examples-js/web3-js/borrow-erc20-with-eth-collateral.js` To borrow Dai with ETH collateral.
- `node examples-js/web3-js/borrow-eth-with-erc20-collateral.js` To borrow ETH with Dai collateral.
- Check out the other examples for Ethers.js and Compound.js in the `examples-js` folder; They all do the same thing.

### Public Test Net or Main Net
- Make sure you have a wallet with ETH for the Ethereum network you plan to interface with (Main, Ropsten, Kovan, etc.).
- Insert the private key of your wallet in the scripts where noted. It's a best practice to insert the private key using an environment variable instead of revealing it in the code with a string literal.
- Replace the HTTP provider in the `web3` constructors in the JS scripts in `web3-js-examples/`. Replace it using the string provided by the "Endpoint" selector in your Infura project dashboard. The localhost test net provider is `http://127.0.0.1:8545`.
- Next, replace the contract addresses in the JSON file with the most recent ones. You can find Compound's cToken contract addresses for each network on this page: [https://compound.finance/docs#networks](https://compound.finance/docs#networks).

## Borrowing Assets With a Solidity Smart Contract
The examples send ETH or DAI to a smart contract, which then mints cETH or cDAI. The contract also marks the assets as collateral for borrowing. Next other assets can be borrowed from the protocol.

### Localhost Testnet
- Run your local testnet in a second command line window **using the command above**. This will seed your account with ERC20 tokens. Look at the script file to find other ERC20 tokens that can be seeded into the account.
- Compile the smart contract in `./contracts/` by running `npx hardhat compile`
- Next, deploy the smart contract to the localhost blockchain. `npx hardhat run ./scripts/deploy.js --network localhost`
- Now that the contract is deployed, copy the address that is logged by the deploy script and paste it into the example script, so it knows where to direct its transactions. All JS files in the `examples-solidity` directory have a variable called `myContractAddress` which is where the `MyContract` address should be supplanted.
- Now you can run any of the following examples to supply via smart contract.
- `node ./examples-solidity/web3-js/borrow-erc20-via-solidity.js` To supply ETH as collateral and borrow Dai.
- `node ./examples-solidity/web3-js/borrow-eth-via-solidity.js` To supply Dai as collateral and borrow ETH.

### Public Testnet or Mainnet
See the Hardhat docs for more information on deploying to public Ethereum networks. https://hardhat.org/guides/deploying.html

## Output Examples

**Borrow ERC20 via Web3 JavaScript**

<details><summary>Output Example</summary>
<p>

```
node examples-js/web3-js/borrow-erc20-with-eth-collateral.js

My Wallet's  ETH Balance: 10000
My Wallet's cETH Balance: 0
My Wallet's  DAI Balance: 100

Supplying ETH to the protocol as collateral (you will get cETH in return)...

My Wallet's  ETH Balance: 9998.999600295
My Wallet's cETH Balance: 49.86112032
My Wallet's  DAI Balance: 100

Entering market (via Comptroller contract) for ETH (as collateral)...
Calculating your liquid assets in the protocol...
Fetching cETH collateral factor...
Fetching DAI price from the price feed...
Fetching borrow rate per block for DAI borrowing...

You have 3384.441740171433 of LIQUID assets (worth of USD) pooled in the protocol.
You can borrow up to 75% of your TOTAL collateral supplied to the protocol as DAI.
1 DAI == 1.000000 USD
You can borrow up to 3384.441740171433 DAI from the protocol.
NEVER borrow near the maximum amount because your account will be instantly liquidated.

Your borrowed amount INCREASES (2.2076358156e-8 * borrowed amount) DAI per block.
This is based on the current borrow rate.

Now attempting to borrow 50 DAI...
My Wallet's  ETH Balance: 9998.998558725
My Wallet's cETH Balance: 49.86112032
My Wallet's  DAI Balance: 150

Fetching DAI borrow balance from cDAI contract...
Borrow balance is 50 DAI

This part is when you do something with those borrowed assets!

Now repaying the borrow...
Approving DAI to be transferred from your wallet to the cDAI contract...

Borrow repaid.

My Wallet's  ETH Balance: 9998.99801022
My Wallet's cETH Balance: 49.86112032
My Wallet's  DAI Balance: 100

```
</p>
</details>

**Borrow ETH via Web3 JavaScript**

<details><summary>Output Example</summary>
<p>

```
node examples-js/web3-js/borrow-eth-with-erc20-collateral.js

My Wallet's  ETH Balance: 10000
My Wallet's cDAI Balance: 0
My Wallet's  DAI Balance: 100

Approving DAI to be transferred from your wallet to the cDAI contract...

Supplying DAI to the protocol as collateral (you will get cDAI in return)...

My Wallet's  ETH Balance: 9999.99525988
My Wallet's cDAI Balance: 691.40915384
My Wallet's  DAI Balance: 85

Entering market (via Comptroller contract) for ETH (as collateral)...
Calculating your liquid assets in the protocol...
Fetching the protocol's DAI collateral factor...
Fetching DAI price from the price feed...
Fetching borrow rate per block for ETH borrowing...

You have 11.249999999912092756 of LIQUID assets (worth of USD) pooled in the protocol.
You can borrow up to 75% of your TOTAL assets supplied to the protocol as ETH.
1 DAI == 1.000000 USD
You can borrow up to 11.249999999912092756 USD worth of assets from the protocol.
NEVER borrow near the maximum amount because your account will be instantly liquidated.

Your borrowed amount INCREASES (1.1208317598e-8 * borrowed amount) ETH per block.
This is based on the current borrow rate.

Now attempting to borrow 0.002 ETH...

ETH borrow successful.

My Wallet's  ETH Balance: 9999.98912288
My Wallet's cDAI Balance: 691.40915384
My Wallet's  DAI Balance: 85

Fetching your ETH borrow balance from cETH contract...
Borrow balance is 0.002 ETH

This part is when you do something with those borrowed assets!

Now repaying the borrow...

Borrow repaid.

My Wallet's  ETH Balance: 9999.98426352
My Wallet's cDAI Balance: 691.40915384
My Wallet's  DAI Balance: 85

```
</p>
</details>

**Borrow ERC20 via Solidity**

<details><summary>Output Example</summary>
<p>

```
node examples-solidity/web3-js/borrow-erc20-via-solidity.js

My Wallet's   ETH Balance: 10000
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0

Calling MyContract.borrowErc20Example with 1 ETH for collateral...

My Wallet's   ETH Balance: 9998.98883272
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 49.86111985
MyContract's  DAI Balance: 10

Now repaying the borrow...

My Wallet's   ETH Balance: 9998.9852758
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 49.86111985
MyContract's  DAI Balance: 0
```
</p>
</details>

**Borrow ETH Token via Solidity**

<details><summary>Output Example</summary>
<p>

```
node examples-solidity/web3-js/borrow-eth-via-solidity.js
My Wallet's   DAI Balance: 100
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 0

Sending 25 DAI to MyContract so it can provide collateral...

My Wallet's   DAI Balance: 75
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 25
MyContract's cDAI Balance: 0

Calling MyContract.borrowEthExample with 25 DAI as collateral...

My Wallet's   DAI Balance: 75
MyContract's  ETH Balance: 0.002
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 1152.34787526

Now repaying the borrow...

My Wallet's   DAI Balance: 75
MyContract's  ETH Balance: 0
MyContract's cETH Balance: 0
MyContract's  DAI Balance: 0
MyContract's cDAI Balance: 1152.34787526

```
</p>
</details>

## Minting Localhost Test ERC20s

All assets supported by the Compound protocol can be seeded into the first account when doing localhost testing. See the `amounts` object at the top of the script `./scripts/run-localhost-fork.js`. You can add assets and amounts to this object. When the localhost fork script is run, Hardhat will move tokens from a whale (cToken contract) to the first wallet of your selected mnemonic (in your environment variable). You can then use these assets freely on your localhost fork.

## Ethers.js & Compound.js Examples

There are several other code examples for [ethers.js](https://ethers.org/) and [Compound.js](https://github.com/compound-finance/compound-js). These SDKs can be used instead of Web3.js in each instance. Each version of the script does the same operations. To try the other code examples, run the scripts in the other folders.

```bash
## Ethers.js Examples
node ./examples-solidity/ethers-js/borrow-erc20-via-solidity.js
node ./examples-solidity/ethers-js/borrow-eth-via-solidity.js
node ./examples-js/ethers-js/borrow-erc20-with-eth-collateral.js
node ./examples-js/ethers-js/borrow-eth-with-erc20-collateral.js

## Compound.js Examples
node ./examples-solidity/compound-js/borrow-erc20-via-solidity.js
node ./examples-solidity/compound-js/borrow-eth-via-solidity.js
node ./examples-js/compound-js/borrow-erc20-with-eth-collateral.js
node ./examples-js/compound-js/borrow-eth-with-erc20-collateral.js

## Web3.js
node ./examples-solidity/web3-js/borrow-erc20-via-solidity.js
node ./examples-solidity/web3-js/borrow-eth-via-solidity.js
node ./examples-js/web3-js/borrow-erc20-with-eth-collateral.js
node ./examples-js/web3-js/borrow-eth-with-erc20-collateral.js
```