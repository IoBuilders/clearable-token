pragma solidity ^0.5.0;

import "eip1996/contracts/Holdable.sol";
import "./libraries/StringUtil.sol";
import "./IClearable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract Clearable is Holdable, IClearable, Ownable{

	using StringUtil for string;


	struct ClearableTransfer {
        address orderer;
        address from;
        address to;
        address clearableAgent;
        uint256 value;
        ClearableTransferStatusCode status;
    }

    mapping(bytes32 => ClearableTransfer) internal clearableTransfers;
	address clearableAgent;



	constructor(){
		clearableAgent = msg.sender; 
	}



    function orderTransfer(string calldata operationId, address to, uint256 value) external returns (bool) {
    	
    	return _orderTransfer(
            operationId,
            msg.sender,
            msg.sender,
            to,
            value
    		);
    }

    function orderTransferFrom(string calldata operationId, address from, address to, uint256 value) external returns (bool) {


    	require(from != address(0), "Payer address must not be zero address");
    	require(isHoldOperatorFor(from, msg.sender), "This operator is not authorized");
    	

    	return _orderTransfer(
            operationId,
            msg.sender,
            from,
            to,
            value
    		);
    }

    function cancelTransfer(string calldata operationId) external returns (bool) {

    	ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];
    	require (ClearableTransfer.status == ClearableTransferStatusCode.Ordered);



    }


    function processClearableTransfer(string calldata operationId) external returns (bool) {

    	ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];

    	require (clearableAgent == msg.sender);
    	require (ClearableTransfer.status == ClearableTransferStatusCode.Ordered);
    	ClearableTransfer.status = ClearableTransferStatusCode.InProcess;

    	
    }


    function executeClearableTransfer(string calldata operationId) external returns (bool) {

    	ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];

    	require (clearableAgent == msg.sender);
    	require (ClearableTransfer.status == ClearableTransferStatusCode.Ordered);

    	bool executeSuccessfull = super.executeHold(operationId, ClearableTransfer.value);
    	if(executeSuccessfull){
    		emit ClearableTransferInProcess(msg.sender, operationId);
    		return true;
    	}

    }


    function rejectClearableTransfer(string calldata operationId, string calldata reason) external returns (bool) {

    	ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];

    	require (clearableAgent == msg.sender);
    	require (ClearableTransfer.status == ClearableTransferStatusCode.Ordered || ClearableTransfer.status == ClearableTransferStatusCode.InProcess);
    	
    	bool rejectsuccessfull = super.releaseHold(operationId);
    	if (rejectsuccessfull){
    		emit ClearableTransferExecuted(msg.sender, operationId, reason);
    		return true;
    	}
    }


    function retrieveClearableTransferData(string calldata operationId) external view returns (address from, address to, uint256 value, ClearableTransferStatusCode status) {
	    ClearableTransfer storage newClearableTransfer = clearableTransfers[operationId.toHash()];
	    return(
	    	ClearableTransfer.from,
	    	ClearableTransfer.to,
	    	ClearableTransfer.value,
	    	ClearableTransfer.status
	    	);

    }

    function authorizeClearableTransferOperator(address operator) external returns (bool) {
    	authorizeHoldOperator(operator);
    	emit AuthorizedClearableTransferOperator(operator, msg.sender);
    	return true;
    }


    function revokeClearableTransferOperator(address operator) external returns (bool) {
    	revokeHoldOperator(operator);
    	emit RevokedClearableTransferOperator(operator, msg.sender);
    	return true;
    }
    function isClearableTransferOperatorFor(address operator, address from) external view returns (bool) {
    	isHoldOperatorFor(operator, from);
    	return true;
    }
   


    function defineClearableAgent (address newClearableAgent) onlyOwner returns (bool){
    	clearableAgent = newClearableAgent;
    	return true;
    }


     function _orderTransfer(string calldata operationId, address orderer, address from, address to, uint256 value) external returns (bool) {

     	bool Ordersuccessfull = super._hold(
            operationId,
            orderer,
            from,
            to,
            clearableAgent,
            value,
            0
        );
        if (Ordersuccessfull) {
        	clearableTransfers[operationId.toHash()].orderer = orderer;
        	clearableTransfers[operationId.toHash()].from = from;
        	clearableTransfers[operationId.toHash()].to = to;
        	clearableTransfers[operationId.toHash()].clearableAgent = clearableAgent;
        	clearableTransfers[operationId.toHash()].value = value;
        	clearableTransfers[operationId.toHash()].status = ClearableTransferStatusCode.Ordered;
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