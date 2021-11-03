// Example to supply DAI as collateral and borrow ETH
// YOU MUST HAVE DAI IN YOUR WALLET before you run this script
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

// Mainnet Contract for the Comptroller
const comptrollerAddress = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';

// Mainnet Contract for cETH
const cEthAddress = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5';
const cEth = new ethers.Contract(cEthAddress, cEthAbi, wallet);

// Mainnet address of underlying token (like DAI or USDC)
const underlyingAddress = '0x6b175474e89094c44da98b954eedeac495271d0f'; // Dai
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
    const myWalletUnderlyingBalance = await underlying.callStatic.balanceOf(myWalletAddress) / Math.pow(10, underlyingDecimals);
    const myContractEthBalance = await provider.getBalance(myContractAddress) / 1e18;
    const myContractCEthBalance = await cEth.callStatic.balanceOf(myContractAddress) / 1e8;
    const myContractUnderlyingBalance = await underlying.callStatic.balanceOf(myContractAddress) / Math.pow(10, underlyingDecimals);
    const myContractCTokenBalance = await cToken.callStatic.balanceOf(myContractAddress) / 1e8;

    console.log(`My Wallet's   ${assetName} Balance:`, myWalletUnderlyingBalance);
    console.log(`MyContract's  ETH Balance:`, myContractEthBalance);
    console.log(`MyContract's cETH Balance:`, myContractCEthBalance);
    console.log(`MyContract's  ${assetName} Balance:`, myContractUnderlyingBalance);
    console.log(`MyContract's c${assetName} Balance:`, myContractCTokenBalance);

    resolve();
  });
};

const main = async () => {
  const contractIsDeployed = (await provider.getCode(myContractAddress)) !== '0x';

  if (!contractIsDeployed) {
    throw Error('MyContract is not deployed! Deploy it by running the deploy script.');
  }

  await logBalances();

  const underlyingAsCollateral = 25;
  const mantissa = (underlyingAsCollateral * Math.pow(10, underlyingDecimals)).toString();
  console.log(`\nSending ${underlyingAsCollateral} ${assetName} to MyContract so it can provide collateral...\n`);

  // Send underlying to MyContract before attempting the supply
  const transferTx = await underlying.transfer(myContractAddress, mantissa);
  await transferTx.wait(1);

  await logBalances();

  console.log(`\nCalling MyContract.borrowEthExample with ${underlyingAsCollateral} ${assetName} as collateral...\n`);

  const borrowTx = await myContract.borrowEthExample(
    cEthAddress,
    comptrollerAddress,
    cTokenAddress,
    underlyingAddress,
    mantissa
  );
  let result = await borrowTx.wait(1);

  // See the solidity functions logs from "MyLog" event
  // console.log(JSON.stringify(result), '\n');

  await logBalances();

  console.log(`\nNow repaying the borrow...\n`);
  const ethToRepayBorrow = 0.002; // hard coded borrow in contract
  const repayTx = await myContract.myEthRepayBorrow(
    cEthAddress,
    ethers.utils.parseEther(ethToRepayBorrow.toString()),
    300000 // gas for the "cEth.repayBorrow" function
  );
  await repayTx.wait(1);

  await logBalances();
};

main().catch(console.error);
