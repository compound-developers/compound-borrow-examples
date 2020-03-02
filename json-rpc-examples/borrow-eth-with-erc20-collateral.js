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

// Main Net Contract for Compound's Comptroller
const comptroller = new web3.eth.Contract(comptrollerAbi, comptrollerAddress);

// Main Net Contract for Compound's Price Oracle
const priceOracle = new web3.eth.Contract(priceOracleAbi, priceOracleAddress);

// Main net address of DAI contract
// https://etherscan.io/address/0x6b175474e89094c44da98b954eedeac495271d0f
const dai = new web3.eth.Contract(daiAbi, daiAddress);

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = +web3.utils.fromWei(await web3.eth.getBalance(myWalletAddress));
    let myWalletCDaiBalance = await cDai.methods.balanceOf(myWalletAddress).call() / 1e8;
    let myWalletDaiBalance = +await dai.methods.balanceOf(myWalletAddress).call() / 1e18;

    console.log("My Wallet's  ETH Balance:", myWalletEthBalance);
    console.log("My Wallet's cDAI Balance:", myWalletCDaiBalance);
    console.log("My Wallet's  DAI Balance:", myWalletDaiBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  let daiToSupplyAsCollateral = '15';
  daiToSupplyAsCollateral = web3.utils.toWei(daiToSupplyAsCollateral, 'ether');

  console.log('\nApproving DAI to be transferred from your wallet to the cDAI contract...\n');
  await dai.methods.approve(cDaiAddress, daiToSupplyAsCollateral).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(100000),     // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
  });

  console.log('Supplying DAI to Compound as collateral (you will get cDAI in return)...\n');
  let mint = await cDai.methods.mint(daiToSupplyAsCollateral).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(1000000),      // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
  });

  if (mint.events && mint.events.Failure) {
    throw new Error(
      `See https://compound.finance/developers/ctokens#ctoken-error-codes\n` +
      `Code: ${mint.events.Failure.returnValues[0]}\n`
    );
  }

  await logBalances();

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [cDaiAddress]; // This is the cToken contract(s) for your collateral
  let enterMarkets = await comptroller.methods.enterMarkets(markets).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(150000),      // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
  });

  console.log('Calculating your liquid assets in Compound...');
  let {1:liquidity} = await comptroller.methods.getAccountLiquidity(myWalletAddress).call();
  liquidity = web3.utils.fromWei(liquidity).toString();

  console.log("Fetching Compound's ETH collateral factor...");
  let {1:collateralFactor} = await comptroller.methods.markets(cEthAddress).call();
  collateralFactor = (collateralFactor / 1e18) * 100; // Convert to percent

  console.log('Fetching DAI price from the price oracle...');
  let daiPriceInEth = await priceOracle.methods.getUnderlyingPrice(cDaiAddress).call();
  daiPriceInEth = daiPriceInEth / 1e18;

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of ETH) pooled in Compound.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL assets supplied to Compound as ETH.`);
  console.log(`1 DAI == ${daiPriceInEth.toFixed(6)} ETH`);
  console.log(`You can borrow up to ${liquidity} ETH from Compound.\n`);

  // Let's try to borrow 90% of our liquid assets (maximum 100%)
  const ethToBorrow = liquidity * 0.9;
  console.log(`Now attempting to borrow ${ethToBorrow} ETH...`);
  await cEth.methods.borrow(web3.utils.toWei(ethToBorrow.toString(), 'ether')).send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(600000),      // posted at compound.finance/developers#gas-costs
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
  });

  await logBalances();
};

main().catch((err) => {
  console.error('ERROR:', err);
});
