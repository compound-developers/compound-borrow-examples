// Example to borrow DAI (or any ERC20 token) using ETH as collateral
// from a Solidity smart contract
const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const {
  cEthAbi,
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

// Mainnet Contract for the Comptroller & Open Price Feed
const comptrollerAddress = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const priceFeedAddress = '0x6d2299c48a8dd07a872fdd0f8233924872ad1071';

// Mainnet address of underlying token (like DAI or USDC)
const underlyingAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // Dai
const underlying = new ethers.Contract(underlyingAddress, erc20Abi, wallet);

// Mainnet address for a cToken (like cDai, https://compound.finance/docs#networks)
const cTokenAddress = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643'; // cDai
const cToken = new ethers.Contract(cTokenAddress, cErcAbi, wallet);
const assetName = 'DAI'; // for the log output lines
const underlyingDecimals = 18; // Number of decimals defined in this ERC20 token's contract

// MyContract
const myContractAbi = require('../../artifacts/contracts/MyContracts.sol/MyContract.json').abi;
const myContractAddress = '0x0Bb909b7c3817F8fB7188e8fbaA2763028956E30';
const myContract = new ethers.Contract(myContractAddress, myContractAbi, wallet);

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = await provider.getBalance(myWalletAddress) / 1e18;
    let myContractEthBalance = await provider.getBalance(myContractAddress) / 1e18;
    let myContractCEthBalance = await cEth.callStatic.balanceOf(myContractAddress) / 1e8;
    let myContractUnderlyingBalance = await underlying.callStatic.balanceOf(myContractAddress) / Math.pow(10, underlyingDecimals);

    console.log("My Wallet's   ETH Balance:", myWalletEthBalance);
    console.log("MyContract's  ETH Balance:", myContractEthBalance);
    console.log("MyContract's cETH Balance:", myContractCEthBalance);
    console.log(`MyContract's  ${assetName} Balance:`, myContractUnderlyingBalance);

    resolve();
  });
};

const main = async () => {
  const contractIsDeployed = (await provider.getCode(myContractAddress)) !== '0x';

  if (!contractIsDeployed) {
    throw Error('MyContract is not deployed! Deploy it by running the deploy script.');
  }

  await logBalances();

  const ethToSupplyAsCollateral = 1;

  console.log(`\nCalling MyContract.borrowErc20Example with ${ethToSupplyAsCollateral} ETH for collateral...\n`);
  let borrowTx = await myContract.borrowErc20Example(
      cEthAddress,
      comptrollerAddress,
      priceFeedAddress,
      cTokenAddress,
      underlyingDecimals,
      { value: (ethToSupplyAsCollateral * 1e18).toString() }
  );
  let result = await borrowTx.wait(1);

  // See the solidity functions logs from "MyLog" event
  // console.log(JSON.stringify(result.events));

  await logBalances();

  console.log(`\nNow repaying the borrow...\n`);
  const underlyingToRepayBorrow = 10;
  const repayTx = await myContract.myErc20RepayBorrow(
      underlyingAddress,
      cTokenAddress,
      (underlyingToRepayBorrow * Math.pow(10, underlyingDecimals)).toString()
  );
  result = repayTx.wait(1);

  await logBalances();
};

main().catch(async (err) => {
  console.error('ERROR:', err);

  // Create "events" and "emit" them in your Solidity code.
  // Current contract does not have any.
  let logs = await myContract.getPastEvents('allEvents');
  console.log('Logs: ', logs);
});
