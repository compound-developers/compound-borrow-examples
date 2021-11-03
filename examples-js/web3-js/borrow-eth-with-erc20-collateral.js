// Example to supply a supported ERC20 token as collateral and borrow ETH
// YOU MUST HAVE DAI IN YOUR WALLET before you run this script
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:8545');
const {
  cEthAbi,
  comptrollerAbi,
  priceFeedAbi,
  cErcAbi,
  erc20Abi,
} = require('../../contracts.json');

// Your Ethereum wallet private key
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

// Add your Ethereum wallet to the Web3 object
web3.eth.accounts.wallet.add('0x' + privateKey);
const myWalletAddress = web3.eth.accounts.wallet[0].address;

// Mainnet Contract for cETH
const cEthAddress = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5';
const cEth = new web3.eth.Contract(cEthAbi, cEthAddress);

// Mainnet Contract for Compound's Comptroller
const comptrollerAddress = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const comptroller = new web3.eth.Contract(comptrollerAbi, comptrollerAddress);

// Mainnet Contract for the Open Price Feed
const priceFeedAddress = '0x6d2299c48a8dd07a872fdd0f8233924872ad1071';
const priceFeed = new web3.eth.Contract(priceFeedAbi, priceFeedAddress);

// Mainnet address of underlying token (like DAI or USDC)
const underlyingAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // Dai
const underlying = new web3.eth.Contract(erc20Abi, underlyingAddress);

// Mainnet address for a cToken (like cDai, https://compound.finance/docs#networks)
const cTokenAddress = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643'; // cDai
const cToken = new web3.eth.Contract(cErcAbi, cTokenAddress);
const assetName = 'DAI'; // for the log output lines
const underlyingDecimals = 18; // Number of decimals defined in this ERC20 token's contract

// Web3 transaction information, we'll use this for every transaction we'll send
const fromMyWallet = {
  from: myWalletAddress,
  gasLimit: web3.utils.toHex(500000),
  gasPrice: web3.utils.toHex(20000000000) // use ethgasstation.info (mainnet only)
};

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = +web3.utils.fromWei(await web3.eth.getBalance(myWalletAddress));
    let myWalletCTokenBalance = await cToken.methods.balanceOf(myWalletAddress).call() / 1e8;
    let myWalletUnderlyingBalance = +await underlying.methods.balanceOf(myWalletAddress).call() / 1e18;

    console.log(`My Wallet's  ETH Balance:`, myWalletEthBalance);
    console.log(`My Wallet's c${assetName} Balance:`, myWalletCTokenBalance);
    console.log(`My Wallet's  ${assetName} Balance:`, myWalletUnderlyingBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  let underlyingAsCollateral = 15;

  // Convert the token amount to a scaled up number, then a string.
  underlyingAsCollateral = underlyingAsCollateral * Math.pow(10, underlyingDecimals);
  underlyingAsCollateral = underlyingAsCollateral.toString();

  console.log(`\nApproving ${assetName} to be transferred from your wallet to the c${assetName} contract...\n`);
  await underlying.methods.approve(cTokenAddress, underlyingAsCollateral).send(fromMyWallet);

  console.log(`Supplying ${assetName} to the protocol as collateral (you will get c${assetName} in return)...\n`);
  let mint = await cToken.methods.mint(underlyingAsCollateral).send(fromMyWallet);

  if (mint.events && mint.events.Failure) {
    throw new Error(
      `See https://compound.finance/docs/ctokens#ctoken-error-codes\n` +
      `Code: ${mint.events.Failure.returnValues[0]}\n`
    );
  }

  await logBalances();

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [cTokenAddress]; // This is the cToken contract(s) for your collateral
  let enterMarkets = await comptroller.methods.enterMarkets(markets).send(fromMyWallet);

  console.log('Calculating your liquid assets in the protocol...');
  let {1:liquidity} = await comptroller.methods.getAccountLiquidity(myWalletAddress).call();
  liquidity = web3.utils.fromWei(liquidity).toString();

  console.log(`Fetching the protocol's ${assetName} collateral factor...`);
  let {1:collateralFactor} = await comptroller.methods.markets(cTokenAddress).call();
  collateralFactor = (collateralFactor / Math.pow(10, underlyingDecimals)) * 100; // Convert to percent

  console.log(`Fetching ${assetName} price from the price feed...`);
  let underlyingPriceInUsd = await priceFeed.methods.price(assetName).call();
  underlyingPriceInUsd = underlyingPriceInUsd / 1e6; // Price feed provides price in USD with 6 decimal places

  console.log('Fetching borrow rate per block for ETH borrowing...');
  let borrowRate = await cEth.methods.borrowRatePerBlock().call();
  borrowRate = borrowRate / 1e18;

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL assets supplied to the protocol as ETH.`);
  console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
  console.log(`You can borrow up to ${liquidity} USD worth of assets from the protocol.`);
  console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);
  console.log(`\nYour borrowed amount INCREASES (${borrowRate} * borrowed amount) ETH per block.\nThis is based on the current borrow rate.`);

  // Let's try to borrow 0.002 ETH (or another amount far below the borrow limit)
  const ethToBorrow = 0.002;
  console.log(`\nNow attempting to borrow ${ethToBorrow} ETH...`);
  const borrowResult = await cEth.methods.borrow(web3.utils.toWei(ethToBorrow.toString(), 'ether')).send(fromMyWallet);

  if (isNaN(borrowResult)) {
    console.log(`\nETH borrow successful.\n`);
  } else {
    throw new Error(
      `See https://compound.finance/docs/ctokens#ctoken-error-codes\n` +
      `Code: ${borrowResult}\n`
    );
  }

  await logBalances();

  console.log('\nFetching your ETH borrow balance from cETH contract...');
  let balance = await cEth.methods.borrowBalanceCurrent(myWalletAddress).call();
  balance = balance / 1e18; // because DAI is a 1e18 scaled token.
  console.log(`Borrow balance is ${balance} ETH`);

  console.log(`\nThis part is when you do something with those borrowed assets!\n`);

  console.log(`Now repaying the borrow...`);

  const ethToRepay = ethToBorrow;
  const repayBorrow = await cEth.methods.repayBorrow().send({
    from: myWalletAddress,
    gasLimit: web3.utils.toHex(600000),
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
    value: web3.utils.toWei(ethToRepay.toString(), 'ether')
  });

  if (repayBorrow.events && repayBorrow.events.Failure) {
    const errorCode = repayBorrow.events.Failure.returnValues.error;
    console.error(`repayBorrow error, code ${errorCode}`);
    process.exit(1);
  }

  console.log(`\nBorrow repaid.\n`);
  await logBalances();
};

main().catch((err) => {
  console.error('ERROR:', err);
});
