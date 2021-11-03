// Example to supply DAI as collateral and borrow ETH
// YOU MUST HAVE DAI IN YOUR WALLET before you run this script
const Compound = require('@compound-finance/compound-js');
const providerUrl = 'http://localhost:8545';

// Your Ethereum wallet private key
const myWalletAddress = '0xa0df350d2637096571F7A701CBc1C5fdE30dF76A';
const privateKey = 'b8c1b5c1d81f9475fdf2e334517d29f733bdfa40682207571b12fc1142cbf329';

// Mainnet Contracts for the Compound Protocol
const comptrollerAddress = Compound.util.getAddress(Compound.Comptroller);
const priceFeedAddress = Compound.util.getAddress(Compound.PriceFeed);
const cEthAddress = Compound.util.getAddress(Compound.cETH);

const assetName = Compound.DAI;
const cTokenName = 'c' + assetName;
const underlyingAddress = Compound.util.getAddress(assetName);
const cTokenAddress = Compound.util.getAddress('c' + assetName);
const underlyingDecimals = Compound.decimals[assetName]; // Number of decimals defined in this ERC20 token's contract

// MyContract
const myContractAddress = '0x0Bb909b7c3817F8fB7188e8fbaA2763028956E30';

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    const myWalletUnderlyingBalance = await _balanceOf(assetName, myWalletAddress);
    const myContractEthBalance = +(await Compound.eth.getBalance(myContractAddress, providerUrl)) / 1e18;
    const myContractCEthBalance = await _balanceOf(Compound.cETH, myContractAddress);
    const myContractUnderlyingBalance = await _balanceOf(assetName, myContractAddress);
    const myContractCTokenBalance = await _balanceOf(cTokenName, myContractAddress);

    console.log(`My Wallet's   ${assetName} Balance:`, myWalletUnderlyingBalance);
    console.log(`MyContract's  ETH Balance:`, myContractEthBalance);
    console.log(`MyContract's cETH Balance:`, myContractCEthBalance);
    console.log(`MyContract's  ${assetName} Balance:`, myContractUnderlyingBalance);
    console.log(`MyContract's c${assetName} Balance:`, myContractCTokenBalance);

    resolve();
  });
};

const main = async () => {
  const ethersProvider = new Compound._ethers.providers.JsonRpcProvider(providerUrl);
  const contractIsDeployed = (await ethersProvider.getCode(myContractAddress)) !== '0x';

  if (!contractIsDeployed) {
    throw Error('MyContract is not deployed! Deploy it by running the deploy script.');
  }

  await logBalances();

  const underlyingAsCollateral = 25;
  const mantissa = (underlyingAsCollateral * Math.pow(10, underlyingDecimals)).toString();
  console.log(`\nSending ${underlyingAsCollateral} ${assetName} to MyContract so it can provide collateral...\n`);

  // Send underlying to MyContract before attempting the supply
  let tx = await _transfer(underlyingAddress, myContractAddress, mantissa);
  await tx.wait(1);

  await logBalances();

  console.log(`\nCalling MyContract.borrowEthExample with ${underlyingAsCollateral} ${assetName} as collateral...\n`);

  tx = await _borrowEthExample(
    myContractAddress,
    cEthAddress,
    comptrollerAddress,
    cTokenAddress,
    underlyingAddress,
    mantissa
  );
  let result = await tx.wait(1);

  // See the solidity functions logs from "MyLog" event
  // console.log(JSON.stringify(result), '\n');

  await logBalances();

  console.log(`\nNow repaying the borrow...\n`);
  const ethToRepayBorrow = 0.002; // hard coded borrow in contract
  tx = await _myEthRepayBorrow(
    myContractAddress,
    cEthAddress,
    (ethToRepayBorrow * 1e18),
    300000 // gas for the "cEth.repayBorrow" function
  );
  await tx.wait(1);

  await logBalances();
};

main().catch(console.error);

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

async function _transfer(
  _erc20Address,
  _recipientAddress,
  _amountScaledUp,
) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      _erc20Address,
      'function transfer(address, uint) public returns (bool)',
      [ _recipientAddress, _amountScaledUp ],
      { provider: providerUrl, privateKey }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}

async function _borrowEthExample(
  _myContractAddress,
  _cEthAddress,
  _comptrollerAddress,
  _cTokenAddress,
  _underlyingAddress,
  _mantissa
) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      _myContractAddress,
      'function borrowEthExample(address payable, address, address, address, uint) public returns (uint)',
      [ 
        _cEthAddress,
        _comptrollerAddress,
        _cTokenAddress,
        _underlyingAddress,
        _mantissa,
      ],
      { provider: providerUrl, privateKey }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}

async function _myEthRepayBorrow(
  _myContractAddress,
  _cEthAddress,
  _ethToRepayBorrow,
  _gas,
) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      _myContractAddress,
      'function myEthRepayBorrow(address, uint, uint) public returns (bool)',
      [ _cEthAddress, _ethToRepayBorrow, _gas ],
      { provider: providerUrl, privateKey }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}
