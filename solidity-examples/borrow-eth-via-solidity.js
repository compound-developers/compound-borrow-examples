// Example to supply DAI as collateral and borrow ETH
// YOU MUST HAVE DAI IN YOUR WALLET before you run this script
// To get localhost test net DAI, run `mint-testnet-dai.js`
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

// Main Net Contract for cDAI (https://compound.finance/developers#networks)
const cDai = new web3.eth.Contract(cDaiAbi, cDaiAddress);

// Main Net Contract for cETH
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
    const myWalletDaiBalance = +await dai.methods.balanceOf(myWalletAddress).call() / 1e18;
    const myContractEthBalance = +web3.utils.fromWei(await web3.eth.getBalance(myContractAddress));
    const myContractCEthBalance = await cEth.methods.balanceOf(myContractAddress).call() / 1e8;
    const myContractDaiBalance = +await dai.methods.balanceOf(myContractAddress).call() / 1e18;
    const myContractCDaiBalance = +await cDai.methods.balanceOf(myContractAddress).call() / 1e8;

    console.log("My Wallet's   DAI Balance:", myWalletDaiBalance);
    console.log("MyContract's  ETH Balance:", myContractEthBalance);
    console.log("MyContract's cETH Balance:", myContractCEthBalance);
    console.log("MyContract's  DAI Balance:", myContractDaiBalance);
    console.log("MyContract's cDAI Balance:", myContractCDaiBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  const daiToSupplyAsCollateral = '15';
  const daiMantissa = web3.utils.toWei(daiToSupplyAsCollateral, 'ether');
  console.log(`\nSending ${daiToSupplyAsCollateral} DAI to MyContract so it can provide collateral...\n`);

  // Send DAI to MyContract before attempting the supply
  await dai.methods.transfer(myContractAddress, daiMantissa).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(5000000),      // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
  });

  await logBalances();

  console.log(`\nCalling MyContract.borrowEthExample with ${daiToSupplyAsCollateral} DAI for collateral...\n`);
  let result = await myContract.methods.borrowEthExample(
    cEthAddress,
    comptrollerAddress,
    cDaiAddress,
    daiAddress,
    daiMantissa
  ).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(6000000),     // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
  });

  // See the solidity functions logs from "MyLog" event
  // console.log(result.events.MyLog);

  await logBalances();

  console.log(`\nNow repaying the borrow...\n`);
  const ethToRepayBorrow = 0.02;
  result = await myContract.methods.myEthRepayBorrow(
      cEthAddress,
      web3.utils.toWei(ethToRepayBorrow.toString(), 'ether')
    ).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(5000000),      // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
  });

  await logBalances();
};

main().catch((err) => {
  console.error('ERROR:', err);
});
