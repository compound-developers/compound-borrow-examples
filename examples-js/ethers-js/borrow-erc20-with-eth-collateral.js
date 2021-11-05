// Example to supply ETH as collateral and borrow a supported ERC-20 token
const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const {
  cEthAbi,
  comptrollerAbi,
  priceFeedAbi,
  cErcAbi,
  erc20Abi,
} = require('../../contracts.json');

// Your Ethereum wallet private key
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';
const wallet = new ethers.Wallet(privateKey, provider);
const myWalletAddress = wallet.address;

// Mainnet Contract for cETH (the collateral-supply process is different for cERC20 tokens)
const cEthAddress = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5';
const cEth = new ethers.Contract(cEthAddress, cEthAbi, wallet);

// Mainnet Contract for the Compound Protocol's Comptroller
const comptrollerAddress = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const comptroller = new ethers.Contract(comptrollerAddress, comptrollerAbi, wallet);

// Mainnet Contract for the Open Price Feed
const priceFeedAddress = '0x6d2299c48a8dd07a872fdd0f8233924872ad1071';
const priceFeed = new ethers.Contract(priceFeedAddress, priceFeedAbi, wallet);

// Mainnet address of underlying token (like DAI or USDC)
const underlyingAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // Dai
const underlying = new ethers.Contract(underlyingAddress, erc20Abi, wallet);

// Mainnet address for a cToken (like cDai, https://compound.finance/docs#networks)
const cTokenAddress = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643'; // cDai
const cToken = new ethers.Contract(cTokenAddress, cErcAbi, wallet);
const assetName = 'DAI'; // for the log output lines
const underlyingDecimals = 18; // Number of decimals defined in this ERC20 token's contract

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = await provider.getBalance(myWalletAddress) / 1e18;
    let myWalletCEthBalance = await cEth.callStatic.balanceOf(myWalletAddress) / 1e8;
    let myWalletUnderlyingBalance = await underlying.callStatic.balanceOf(myWalletAddress) / Math.pow(10, underlyingDecimals);

    console.log("My Wallet's  ETH Balance:", myWalletEthBalance);
    console.log("My Wallet's cETH Balance:", myWalletCEthBalance);
    console.log(`My Wallet's  ${assetName} Balance:`, myWalletUnderlyingBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  const ethToSupplyAsCollateral = 1;

  console.log('\nSupplying ETH to the protocol as collateral (you will get cETH in return)...\n');
  let mint = await cEth.mint({
    value: (ethToSupplyAsCollateral * 1e18).toString()
  });

  await logBalances();

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [ cEthAddress ]; // This is the cToken contract(s) for your collateral
  let enterMarkets = await comptroller.enterMarkets(markets);
  await enterMarkets.wait(1);

  console.log('Calculating your liquid assets in the protocol...');
  let { 1:liquidity } = await comptroller.callStatic.getAccountLiquidity(myWalletAddress);
  liquidity = liquidity / 1e18;

  console.log('Fetching cETH collateral factor...');
  let { 1:collateralFactor } = await comptroller.callStatic.markets(cEthAddress);
  collateralFactor = (collateralFactor / 1e18) * 100; // Convert to percent

  console.log(`Fetching ${assetName} price from the price feed...`);
  let underlyingPriceInUsd = await priceFeed.callStatic.price(assetName);
  underlyingPriceInUsd = underlyingPriceInUsd / 1e6; // Price feed provides price in USD with 6 decimal places

  console.log(`Fetching borrow rate per block for ${assetName} borrowing...`);
  let borrowRate = await cToken.callStatic.borrowRatePerBlock();
  borrowRate = borrowRate / Math.pow(10, underlyingDecimals);

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL collateral supplied to the protocol as ${assetName}.`);
  console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
  console.log(`You can borrow up to ${liquidity/underlyingPriceInUsd} ${assetName} from the protocol.`);
  console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);
  console.log(`\nYour borrowed amount INCREASES (${borrowRate} * borrowed amount) ${assetName} per block.\nThis is based on the current borrow rate.\n`);

  const underlyingToBorrow = 50;
  console.log(`Now attempting to borrow ${underlyingToBorrow} ${assetName}...`);
  const scaledUpBorrowAmount = (underlyingToBorrow * Math.pow(10, underlyingDecimals)).toString();
  const trx = await cToken.borrow(scaledUpBorrowAmount);
  await trx.wait(1);
  // console.log('Borrow Transaction', trx);

  await logBalances();

  console.log(`\nFetching ${assetName} borrow balance from c${assetName} contract...`);
  let balance = await cToken.callStatic.borrowBalanceCurrent(myWalletAddress);
  balance = balance / Math.pow(10, underlyingDecimals);
  console.log(`Borrow balance is ${balance} ${assetName}`);

  console.log(`\nThis part is when you do something with those borrowed assets!\n`);

  console.log(`Now repaying the borrow...`);
  console.log(`Approving ${assetName} to be transferred from your wallet to the c${assetName} contract...`);
  const underlyingToRepay = (underlyingToBorrow * Math.pow(10, underlyingDecimals)).toString();
  const approve = await underlying.approve(cTokenAddress, underlyingToRepay);
  await approve.wait(1);

  const repayBorrow = await cToken.repayBorrow(underlyingToRepay);
  const repayBorrowResult = await repayBorrow.wait(1);

  const failure = repayBorrowResult.events.find(_ => _.event === 'Failure');
  if (failure) {
    const errorCode = failure.args.error;
    console.error(`repayBorrow error, code ${errorCode}`);
    process.exit(1);
  }

  console.log(`\nBorrow repaid.\n`);
  await logBalances();
};

main().catch((err) => {
  console.error('ERROR:', err);
});
