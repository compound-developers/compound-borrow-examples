// Example to supply a supported ERC20 token as collateral and borrow ETH
// YOU MUST HAVE DAI IN YOUR WALLET before you run this script
const Compound = require('@compound-finance/compound-js');
const providerUrl = 'http://localhost:8545';

// Your Ethereum wallet private key
const myWalletAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

const compound = new Compound(providerUrl, { privateKey });

// Mainnet Contract for Compound's Comptroller
const comptrollerAddress = Compound.util.getAddress(Compound.Comptroller);

const assetName = Compound.DAI;
const cTokenName = Compound.cDAI;
const underlyingAddress = Compound.util.getAddress(assetName);
const cTokenAddress = Compound.util.getAddress(cTokenName);
const underlyingDecimals = Compound.decimals[assetName]; // Number of decimals defined in this ERC20 token's contract

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = +(await Compound.eth.getBalance(myWalletAddress, providerUrl)) / 1e18;
    let myWalletCTokenBalance = await _balanceOf(cTokenName, myWalletAddress);
    let myWalletUnderlyingBalance = await _balanceOf(assetName, myWalletAddress);

    console.log("My Wallet's  ETH Balance:", myWalletEthBalance);
    console.log(`My Wallet's c${assetName} Balance:`, myWalletCTokenBalance);
    console.log(`My Wallet's  ${assetName} Balance:`, myWalletUnderlyingBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  let underlyingAsCollateral = 15;

  console.log(`Supplying ${assetName} to the protocol as collateral (you will get c${assetName} in return)...\n`);
  let tx = await compound.supply(assetName, underlyingAsCollateral);
  const mintResult = await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  let failure = mintResult.events.find(_ => _.event === 'Failure');
  if (failure) {
    const errorCode = failure.args.error;
    throw new Error(
      `See https://compound.finance/docs/ctokens#ctoken-error-codes\n` +
      `Code: ${errorCode}\n`
    );
  }

  await logBalances();

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [ assetName ]; // This is the collateral asset
  tx = await compound.enterMarkets(markets);
  await tx.wait(1);

  console.log('Calculating your liquid assets in the protocol...');
  let liquidity = await _getAccountLiquidity(myWalletAddress, comptrollerAddress);

  console.log(`Fetching the protocol's ${assetName} collateral factor...`);
  let collateralFactor = await _getCollateralFactor(cTokenAddress, comptrollerAddress); // as percentage

  console.log(`Fetching ${assetName} price from the price feed...`);
  let underlyingPriceInUsd = await compound.getPrice(assetName);

  console.log('Fetching borrow rate per block for ETH borrowing...');
  let borrowRate = await _borrowRatePerBlock(cTokenAddress);

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL assets supplied to the protocol as ETH.`);
  console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
  console.log(`You can borrow up to ${liquidity} USD worth of assets from the protocol.`);
  console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);
  console.log(`\nYour borrowed amount INCREASES (${borrowRate} * borrowed amount) ETH per block.\nThis is based on the current borrow rate.`);

  // Let's try to borrow 0.002 ETH (or another amount far below the borrow limit)
  const ethToBorrow = 0.002;
  console.log(`\nNow attempting to borrow ${ethToBorrow} ETH...`);
  tx = await compound.borrow(Compound.ETH, ethToBorrow);
  const borrowResult = await tx.wait(1);

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
  const cEthAddress = Compound.util.getAddress(Compound.cETH);
  let balance = await _borrowBalanceCurrent(cEthAddress, myWalletAddress);
  console.log(`Borrow balance is ${balance} ETH`);

  console.log(`\nThis part is when you do something with those borrowed assets!\n`);

  console.log(`Now repaying the borrow...`);

  const ethToRepay = ethToBorrow;

  tx = await compound.repayBorrow(Compound.ETH, ethToRepay);
  const repayBorrowResult = await tx.wait(1);

  failure = repayBorrowResult.events.find(_ => _.event === 'Failure');
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

async function _balanceOf(asset, account) {
  const assetAddress = Compound.util.getAddress(Compound[asset]);
  let balance;
  try {
    balance = await Compound.eth.read(
      assetAddress,
      'function balanceOf(address) returns (uint)',
      [ account ],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return +balance / Math.pow(10, Compound.decimals[asset]);
}

async function _getAccountLiquidity(account, _comptrollerAddress) {
  let error, liquidity, shortfall;
  try {
    [ error, liquidity, shortfall ] = await Compound.eth.read(
      _comptrollerAddress,
      'function getAccountLiquidity(address account) view returns (uint, uint, uint)',
      [ account ],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return liquidity / 1e18;
}

async function _getCollateralFactor(_cTokenAddress, _comptrollerAddress) {
  let isListed, collateralFactor, isComped;

  try {
    [ isListed, collateralFactor, isComped ] = await Compound.eth.read(
      _comptrollerAddress,
      'function markets(address cTokenAddress) view returns (bool, uint, bool)',
      [ _cTokenAddress ],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return (collateralFactor / 1e18) * 100;
}

async function _borrowRatePerBlock(_cTokenAddress) {
  let borrowRatePerBlock;
  try {
    borrowRatePerBlock = await Compound.eth.read(
      _cTokenAddress,
      'function borrowRatePerBlock() returns (uint)',
      [],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return borrowRatePerBlock / Math.pow(10, underlyingDecimals);
}

async function _borrowBalanceCurrent(_cTokenAddress, account) {
  let borrowBalance;
  try {
    borrowBalance = await Compound.eth.read(
      _cTokenAddress,
      'function borrowBalanceCurrent(address account) returns (uint)',
      [ account ],
      { provider: providerUrl }
    );
  } catch(error) {
    console.error(error);
  }

  return borrowBalance / Math.pow(10, underlyingDecimals);
}
