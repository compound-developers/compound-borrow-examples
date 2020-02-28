pragma solidity ^0.5.12;

contract Erc20 {
  function approve(address, uint) external returns (bool);
  function transfer(address, uint) external returns (bool);
}

contract CErc20 {
  function mint(uint) external returns (uint);
  function borrow(uint borrowAmount) external returns (uint);
}

contract CEth {
  function mint() external payable;
  function borrow(uint borrowAmount) external returns (uint);
}

contract Comptroller {
  function enterMarkets(address[] calldata) external returns (uint[] memory);
  function getAccountLiquidity(address) external view returns (uint, uint, uint);
}

contract PriceOracle {
  function getUnderlyingPrice(address) external view returns (uint);
}

contract MyContract {
  function supplyEthBorrowErc20(
    address payable _cEtherAddress,
    address _comptrollerAddress,
    address _priceOracleAddress,
    address _cDaiAddress
  ) public payable returns (bool)
  {
    CEth cEth = CEth(_cEtherAddress);
    Comptroller comptroller = Comptroller(_comptrollerAddress);
    PriceOracle priceOracle = PriceOracle(_priceOracleAddress);
    CErc20 cDai = CErc20(_cDaiAddress);

    // Supply ETH as collateral, get cETH in return
    cEth.mint.value(msg.value)();

    // Enter the ETH market so you can borrow another type of asset
    address[] memory cTokens = new address[](1);
    cTokens[0] = _cEtherAddress;
    uint[] memory errors = comptroller.enterMarkets(cTokens);
    if (errors[0] != 0) {
      revert("Comptroller.enterMarkets failed.");
    }

    // Get my account's total liquidity value in Compound
    (
      uint error,
      uint liquidity,
      uint shortfall
    ) = comptroller.getAccountLiquidity(address(this));
    if (error != 0) {
      revert("Comptroller.getAccountLiquidity failed.");
    }
    require(shortfall == 0, "account underwater");
    require(liquidity > 0, "account has excess collateral");

    // Get the DAI price in ETH from the Price Oracle,
    // so we can find out the maximum amount of DAI we can borrow.
    uint daiPriceInWei = priceOracle.getUnderlyingPrice(_cDaiAddress);

    uint maxBorrowDaiInWei = liquidity / daiPriceInWei;

    // Borrow half of allowed borrow as DAI
    uint numDaiToBorrow = maxBorrowDaiInWei / 2;

    // Borrow DAI, check the DAI balance for this contract's address
    cDai.borrow(numDaiToBorrow * 1e18);

    return true;
  }

  function supplyErc20BorrowEth(
    address payable _cEtherAddress,
    address _comptrollerAddress,
    address _cDaiAddress,
    address _daiAddress,
    uint _daiToSupplyAsCollateral
  ) public returns (bool)
  {
    CEth cEth = CEth(_cEtherAddress);
    Comptroller comptroller = Comptroller(_comptrollerAddress);
    CErc20 cDai = CErc20(_cDaiAddress);
    Erc20 dai = Erc20(_daiAddress);

    // Approve transfer of DAI
    dai.approve(_cDaiAddress, _daiToSupplyAsCollateral);

    // Supply DAI as collateral, get cDAI in return
    uint error = cDai.mint(_daiToSupplyAsCollateral);
    require(error == 0, "CErc20.mint Error");

    // Enter the DAI market so you can borrow another type of asset
    address[] memory cTokens = new address[](1);
    cTokens[0] = _cDaiAddress;
    uint[] memory errors = comptroller.enterMarkets(cTokens);
    if (errors[0] != 0) {
      revert("Comptroller.enterMarkets failed.");
    }

    // Get my account's total liquidity value in Compound
    (
      uint error2,
      uint liquidity,
      uint shortfall
    ) = comptroller.getAccountLiquidity(address(this));
    if (error2 != 0) {
      revert("Comptroller.getAccountLiquidity failed.");
    }
    require(shortfall == 0, "account underwater");
    require(liquidity > 0, "account has excess collateral");

    // Borrow half of allowed borrow as ETH
    uint numWeiToBorrow = liquidity / 2;

    // Borrow DAI, check the DAI balance for this contract's address
    cEth.borrow(numWeiToBorrow);

    return true;
  }

  // Need this to receive ETH when `supplyErc20BorrowEth` executes
  function () external payable {}
}
