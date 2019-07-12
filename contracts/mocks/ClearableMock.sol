pragma solidity ^0.5.0;

import "../Clearable.sol";


contract ClearableMock is Clearable {

    function mint(address account, uint256 value) external {
        _mint(account, value);
    }
}
