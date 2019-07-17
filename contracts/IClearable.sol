pragma solidity ^0.5.0;


interface IClearable /* is ERC-1996 */ {
    enum ClearableTransferStatusCode { Nonexistent, Ordered, InProcess, Executed, Rejected, Cancelled }

    function orderTransfer(string calldata operationId, address to, uint256 value) external returns (bool);
    function orderTransferFrom(
        string calldata operationId,
        address from,
        address to,
        uint256 value
    ) external returns (bool);
    function cancelTransfer(string calldata operationId) external returns (bool);
    function processClearableTransfer(string calldata operationId) external returns (bool);
    function executeClearableTransfer(string calldata operationId) external returns (bool);
    function rejectClearableTransfer(string calldata operationId, string calldata reason) external returns (bool);
    function retrieveClearableTransferData(string calldata operationId) external view returns (
        address from,
        address to,
        uint256 value,
        ClearableTransferStatusCode status
    );

    function authorizeClearableTransferOperator(address operator) external returns (bool);
    function revokeClearableTransferOperator(address operator) external returns (bool);
    function isClearableTransferOperatorFor(address operator, address from) external view returns (bool);

    event ClearableTransferOrdered(address indexed orderer, string operationId, address indexed from, address indexed to, uint256 value);
    event ClearableTransferInProcess(address indexed orderer, string operationId);
    event ClearableTransferExecuted(address indexed orderer, string operationId);
    event ClearableTransferRejected(address indexed orderer, string operationId, string reason);
    event ClearableTransferCancelled(address indexed orderer, string operationId);
    event AuthorizedClearableTransferOperator(address indexed operator, address indexed account);
    event RevokedClearableTransferOperator(address indexed operator, address indexed account);
}
