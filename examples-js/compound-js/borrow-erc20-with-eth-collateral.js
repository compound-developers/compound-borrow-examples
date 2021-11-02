// Example to supply ETH as collateral and borrow a supported ERC-20 token
const Compound = require('@compound-finance/compound-js');
const providerUrl = 'http://localhost:8545';

// Your Ethereum wallet private key
const myWalletAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

const compound = new Compound(providerUrl, { privateKey });

// Mainnet Contract for the Compound Protocol's Comptroller
const comptrollerAddress = Compound.util.getAddress(Compound.Comptroller);

const assetName = Compound.DAI;
const underlyingAddress = Compound.util.getAddress(assetName);
const cTokenAddress = Compound.util.getAddress('c' + assetName);
const underlyingDecimals = Compound.decimals[assetName]; // Number of decimals defined in this ERC20 token's contract

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = +(await Compound.eth.getBalance(myWalletAddress, providerUrl)) / 1e18;
    let myWalletCEthBalance = await _balanceOf(Compound.cETH, myWalletAddress);
    let myWalletUnderlyingBalance = await _balanceOf(assetName, myWalletAddress);

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
  let tx = await compound.supply(Compound.ETH, ethToSupplyAsCollateral);
  await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain

  await logBalances();

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [ Compound.ETH ]; // This is the collateral asset
  tx = await compound.enterMarkets(markets);
  await tx.wait(1);

  console.log('Calculating your liquid assets in the protocol...');
  let liquidity = await _getAccountLiquidity(myWalletAddress, comptrollerAddress);

  console.log('Fetching cETH collateral factor...');
  let collateralFactor = await _getCollateralFactor(cTokenAddress, comptrollerAddress); // as percentage

  console.log(`Fetching ${assetName} price from the price feed...`);
  let underlyingPriceInUsd = await compound.getPrice(assetName);

  console.log(`Fetching borrow rate per block for ${assetName} borrowing...`);
  let borrowRate = await _borrowRatePerBlock(cTokenAddress);

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL collateral supplied to the protocol as ${assetName}.`);
  console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
  console.log(`You can borrow up to ${liquidity/underlyingPriceInUsd} ${assetName} from the protocol.`);
  console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);
  console.log(`\nYour borrowed amount INCREASES (${borrowRate} * borrowed amount) ${assetName} per block.\nThis is based on the current borrow rate.\n`);

  const underlyingToBorrow = 50;
  console.log(`Now attempting to borrow ${underlyingToBorrow} ${assetName}...`);
  tx = await compound.borrow(assetName, underlyingToBorrow);
  await tx.wait(1);
  // console.log('Borrow Transaction', tx);

  await logBalances();

  console.log(`\nFetching ${assetName} borrow balance from c${assetName} contract...`);
  let balance = await _borrowBalanceCurrent(cTokenAddress, myWalletAddress);
  console.log(`Borrow balance is ${balance} ${assetName}`);

  console.log(`\nThis part is when you do something with those borrowed assets!\n`);

  console.log(`Now repaying the borrow...`);
  console.log(`Approving ${assetName} to be transferred from your wallet to the c${assetName} contract...`);

  const underlyingToRepay = underlyingToBorrow;

  tx = await compound.repayBorrow(assetName, underlyingToRepay);
  const repayBorrowResult = await tx.wait(1);

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
