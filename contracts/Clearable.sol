pragma solidity ^0.5.0;

import "eip1996/contracts/Holdable.sol";
import "./IClearable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Clearable is Holdable, IClearable, Ownable {

    using StringUtil for string;

    struct ClearableTransfer {
        ClearableTransferStatusCode status;
    }

    mapping(bytes32 => ClearableTransfer) internal clearableTransfers;
    mapping(address => mapping(address => bool)) private operators;
    address clearingAgent;

    constructor() public{
        clearingAgent = msg.sender; 
    }

    function orderTransfer(string calldata operationId, address to, uint256 value) external returns (bool) {
        require(to != address(0), "Payee address must not be zero address");
        return _orderTransfer(
            operationId,
            msg.sender,
            msg.sender,
            to,
            value
            );
    }

    function orderTransferFrom(string calldata operationId, address from, address to, uint256 value) external returns (bool) {
        require(to != address(0), "Payee address must not be zero address");
        require(from != address(0), "Payer address must not be zero address");
        require(operators[from][msg.sender] == true, "This operator is not authorized");
        return _orderTransfer(
            operationId,
            msg.sender,
            from,
            to,
            value
            );
    }

    function cancelTransfer(string calldata operationId) external returns (bool) {
        Hold storage newClearableHold = holds[operationId.toHash()];
        ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];
        require (msg.sender == newClearableHold.origin, "Can only be processed by the payer");
        require (newClearableTransfer.status == ClearableTransferStatusCode.Ordered, "A transfer can only be cancelled in status Ordered");
        super._releaseHold(operationId);
        newClearableTransfer.status = ClearableTransferStatusCode.Cancelled;
        emit ClearableTransferCancelled(msg.sender, operationId);
        return true;
    }

    function processClearableTransfer(string calldata operationId) external returns (bool) {
        ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];
        require (msg.sender == clearingAgent, "Can only be processed by the agent");
        require (newClearableTransfer.status == ClearableTransferStatusCode.Ordered,  "A transfer can only be processed in status Ordered");
        newClearableTransfer.status = ClearableTransferStatusCode.InProcess;
        emit ClearableTransferInProcess(msg.sender, operationId);
        return true;
    }

    function executeClearableTransfer(string calldata operationId) external returns (bool) {
        ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];
        Hold storage newClearableHold = holds[operationId.toHash()];
        require (msg.sender == clearingAgent, "Can only be executed by the agent");
        require (newClearableTransfer.status == ClearableTransferStatusCode.Ordered || newClearableTransfer.status == ClearableTransferStatusCode.InProcess,  "A transfer can only be executed in status Ordered or InProcess");
        super._setHoldToExecuted(operationId, newClearableHold.value);
        super._transfer(newClearableHold.origin, newClearableHold.target, newClearableHold.value);
        newClearableTransfer.status = ClearableTransferStatusCode.Executed;
        emit ClearableTransferExecuted(msg.sender, operationId);

        return true;
    }

    function rejectClearableTransfer(string calldata operationId, string calldata reason) external returns (bool) {
        ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];
        require (msg.sender == clearingAgent, "Can only be rejected by the agent");
        require (newClearableTransfer.status == ClearableTransferStatusCode.Ordered || newClearableTransfer.status == ClearableTransferStatusCode.InProcess, "A transfer can only be rejected in status Ordered or InProcess");
        super._releaseHold(operationId);
        newClearableTransfer.status = ClearableTransferStatusCode.Rejected;
        emit ClearableTransferRejected(msg.sender, operationId, reason);

        return true;
    }

    function retrieveClearableTransferData(string calldata operationId) external view returns (address from, address to, uint256 value, ClearableTransferStatusCode status) {
        ClearableTransfer storage clearableTransferData = clearableTransfers[operationId.toHash()];
        Hold storage newClearableHold = holds[operationId.toHash()];
        return(
            newClearableHold.origin,
            newClearableHold.target,
            newClearableHold.value,
            clearableTransferData.status
            );
    }

    function authorizeClearableTransferOperator(address operator) external returns (bool) {
        require (operators[msg.sender][operator] == false, "The operator is already authorized");

        operators[msg.sender][operator] = true;
        emit AuthorizedClearableTransferOperator(operator, msg.sender);
        return true;
    }

    function revokeClearableTransferOperator(address operator) external returns (bool) {
        require (operators[msg.sender][operator] == true, "The operator is already not authorized");

        operators[msg.sender][operator] = false;
        emit RevokedClearableTransferOperator(operator, msg.sender);
        return true;
    }

    function isClearableTransferOperatorFor(address operator, address from) external view returns (bool) {
        return operators[from][operator];
    }

    function defineClearingAgent (address newClearingAgent) onlyOwner external  returns (bool) {
        clearingAgent = newClearingAgent;
        return true;
    }

    function isClearingAgent(address agent) external returns (bool) {
        return agent == clearingAgent;
    }

    function _orderTransfer(string memory operationId, address orderer, address from, address to, uint256 value) internal returns (bool) {
        super._hold(
            operationId,
            orderer,
            from,
            to,
            clearingAgent,
            value,
            0
        );
        ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];
        newClearableTransfer.status = ClearableTransferStatusCode.Ordered;
        emit ClearableTransferOrdered(
            orderer,
            operationId,
            from,
            to,
            value
        );

        return true;
    }
}