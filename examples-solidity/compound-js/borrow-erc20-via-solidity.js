// Example to borrow DAI (or any ERC20 token) using ETH as collateral
// from a Solidity smart contract
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
const underlyingAddress = Compound.util.getAddress(assetName);
const cTokenAddress = Compound.util.getAddress('c' + assetName);
const underlyingDecimals = Compound.decimals[assetName]; // Number of decimals defined in this ERC20 token's contract

// MyContract
const myContractAddress = '0x0Bb909b7c3817F8fB7188e8fbaA2763028956E30';

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = +(await Compound.eth.getBalance(myWalletAddress, providerUrl)) / 1e18;
    let myContractEthBalance = +(await Compound.eth.getBalance(myContractAddress, providerUrl)) / 1e18;
    let myContractCEthBalance = await _balanceOf(Compound.cETH, myContractAddress);
    let myContractUnderlyingBalance = await _balanceOf(assetName, myContractAddress);

    console.log("My Wallet's   ETH Balance:", myWalletEthBalance);
    console.log("MyContract's  ETH Balance:", myContractEthBalance);
    console.log("MyContract's cETH Balance:", myContractCEthBalance);
    console.log(`MyContract's  ${assetName} Balance:`, myContractUnderlyingBalance);

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

  const ethToSupplyAsCollateral = 1;

  console.log(`\nCalling MyContract.borrowErc20Example with ${ethToSupplyAsCollateral} ETH for collateral...\n`);
  let tx = await _borrowErc20Example(
    myContractAddress,
    cEthAddress,
    comptrollerAddress,
    priceFeedAddress,
    cTokenAddress,
    underlyingDecimals,
    (ethToSupplyAsCollateral * 1e18).toString()
  );
  let result = await tx.wait(1);

  // See the solidity functions logs from "MyLog" event
  // console.log(JSON.stringify(result.events));

  await logBalances();

  console.log(`\nNow repaying the borrow...\n`);
  const underlyingToRepayBorrow = 10;
  tx = await _myErc20RepayBorrow(
    myContractAddress,
    underlyingAddress,
    cTokenAddress,
    (underlyingToRepayBorrow * Math.pow(10, underlyingDecimals)).toString()
  );
  result = tx.wait(1);

  await logBalances();
};

main().catch(async (err) => {
  console.error('ERROR:', err);

  // Create "events" and "emit" them in your Solidity code.
  // Current contract does not have any.
  let logs = await myContract.getPastEvents('allEvents');
  console.log('Logs: ', logs);
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

async function _borrowErc20Example(
  _myContractAddress,
  _cEthAddress,
  _comptrollerAddress,
  _priceFeedAddress,
  _cTokenAddress,
  _underlyingDecimals,
  ethAmount
) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      _myContractAddress,
      'function borrowErc20Example(address payable, address, address, address, uint) public payable returns (uint)',
      [
        _cEthAddress,
        _comptrollerAddress,
        _priceFeedAddress,
        _cTokenAddress,
        _underlyingDecimals
      ],
      {
        value: ethAmount,
        provider: providerUrl,
        privateKey
      }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}

async function _myErc20RepayBorrow(
  _myContractAddress,
  _underlyingAddress,
  _cTokenAddress,
  _underlyingToRepayBorrow
) {
  let tx;
  try {
    tx = await Compound.eth.trx(
      _myContractAddress,
      'function myErc20RepayBorrow(address, address, uint) public returns (bool)',
      [ _underlyingAddress, _cTokenAddress, _underlyingToRepayBorrow ],
      { provider: providerUrl, privateKey }
    );
  } catch(error) {
    console.error(error);
  }

  return tx;
}
