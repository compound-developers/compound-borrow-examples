// Example to borrow DAI (or any ERC20 token) using ETH as collateral
// from a Solidity smart contract
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:8545');
const {
  cEthAddress,
  cEthAbi,
  comptrollerAddress,
  comptrollerAbi,
  priceOracleAddress,
  priceOracleAbi,
  daiAddress,
  daiAbi,
  cDaiAddress,
  cDaiAbi
} = require('../contracts.json');

// Your Ethereum wallet private key
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

// Add your Ethereum wallet to the Web3 object
web3.eth.accounts.wallet.add('0x' + privateKey);
const myWalletAddress = web3.eth.accounts.wallet[0].address;

// Main Net Contract for cETH (the collateral-supply process is different for cERC20 tokens)
const cEth = new web3.eth.Contract(cEthAbi, cEthAddress);

// Main net address of DAI contract
// https://etherscan.io/address/0x6b175474e89094c44da98b954eedeac495271d0f
const dai = new web3.eth.Contract(daiAbi, daiAddress);

// MyContract
const myContractAbi = require('../.build/abi.json');
const myContractAddress = '0x9C5Dd70D98e9B321217e8232235e25E64E78C595';
const myContract = new web3.eth.Contract(myContractAbi, myContractAddress);

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = +web3.utils.fromWei(await web3.eth.getBalance(myWalletAddress));
    let myContractEthBalance = +web3.utils.fromWei(await web3.eth.getBalance(myContractAddress));
    let myContractCEthBalance = await cEth.methods.balanceOf(myContractAddress).call() / 1e8;
    let myContractDaiBalance = +await dai.methods.balanceOf(myContractAddress).call() / 1e18;

    console.log("My Wallet's   ETH Balance:", myWalletEthBalance);
    console.log("MyContract's  ETH Balance:", myContractEthBalance);
    console.log("MyContract's cETH Balance:", myContractCEthBalance);
    console.log("MyContract's  DAI Balance:", myContractDaiBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  const ethToSupplyAsCollateral = '1';

  console.log(`\nCalling MyContract.supplyEthBorrowErc20 with ${ethToSupplyAsCollateral} ETH for collateral...\n`);
  let result = await myContract.methods.supplyEthBorrowErc20(
      cEthAddress,
      comptrollerAddress,
      priceOracleAddress,
      cDaiAddress
    ).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(5000000),      // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
    value: web3.utils.toHex(web3.utils.toWei(ethToSupplyAsCollateral, 'ether'))
  });

  // console.log('result', JSON.stringify(result));

  await logBalances();
};

main().catch(async (err) => {
  console.error('ERROR:', err);

  // Create "events" and "emit" them in your Solidity code.
  // Current contract does not have any.
  let logs = await myContract.getPastEvents('allEvents');
  console.log('Logs: ', logs);
});
