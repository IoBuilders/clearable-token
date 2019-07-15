const truffleAssert = require('truffle-assertions');
const randomString = require("randomstring");

const Clearable = artifacts.require('ClearableMock');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('Clearable', (accounts) => {
    let operationId;
    let reason = 'test';

    const owner = accounts[0];
    const payer = accounts[1];
    const payee = accounts[2];
    const authorizedOperator = accounts[3];
    const unauthorizedOperator = accounts[4];
    const newAgent = accounts[5];

    const InProcess = 2;
    const Cancelled = 5

    beforeEach(async() => {
        clearable = await Clearable.new({from: owner});
        await clearable.mint(payer, 3);

        operationId = randomString.generate();
    });

    describe('orderTransfer', async() => {
        it('should revert if operation ID is empty', async() => {
            await truffleAssert.reverts(
                clearable.orderTransfer(
                    '',
                    payee,
                    1,
                    {from: payer}
                ),
                'Operation ID must not be empty'
            );
        });

        it('should revert if value is zero', async() => {
            await truffleAssert.reverts(
                clearable.orderTransfer(
                    operationId,
                    payee,
                    0,
                    {from: payer}
                ),
                'Value must be greater than zero'
            );
        });

        it('should revert if operation ID is already used', async() => {
            await clearable.orderTransfer(
                operationId,
                payee,
                1,
                {from: payer}
            );

            await truffleAssert.reverts(
                clearable.orderTransfer(
                    operationId,
                    payee,
                    1,
                    {from: payer}
                ),
                'This operationId already exists'
            );
        });

        it('should revert if payee address is zero', async() => {
            await truffleAssert.reverts(
                clearable.orderTransfer(
                    operationId,
                    ZERO_ADDRESS,
                    1,
                    {from: payer}
                ),
                'Payee address must not be zero address'
            );
        });

        it('should revert if value greater than balance', async() => {
            await truffleAssert.reverts(
                clearable.orderTransfer(
                    operationId,
                    payee,
                    4,
                    {from: payer}
                )
            );
        });

        it('should successfully create a transfer and emit a ClearableTransferOrdered event', async() => {
              const tx = await clearable.orderTransfer(
                  operationId,
                  payee,
                  1,
                  {from: payer}
              );

            truffleAssert.eventEmitted(tx, 'ClearableTransferOrdered', (_event) => {
                return _event.orderer === payer &&
                    _event.operationId === operationId &&
                    _event.from === payer &&
                    _event.to === payee &&
                    _event.value.toNumber() === 1
                ;
            });
        });
    });

    describe('orderTransferFrom', async() => {
        beforeEach(async() => {
            await clearable.authorizeClearableTransferOperator(
                authorizedOperator,
                {from: payer}
            );
        });

        it('should revert if operation ID is empty', async() => {
            await truffleAssert.reverts(
                clearable.orderTransferFrom(
                    '',
                    payer,
                    payee,
                    0,
                    {from: authorizedOperator}
                ),
                'Operation ID must not be empty'
            );
        });

        it('should revert if value is zero', async() => {
            await truffleAssert.reverts(
                clearable.orderTransferFrom(
                    operationId,
                    payer,
                    payee,
                    0,
                    {from: authorizedOperator}
                ),
                'Value must be greater than zero'
            );
        });

        it('should revert if operation ID is already used', async() => {
            await clearable.orderTransferFrom(
                operationId,
                payer,
                payee,
                1,
                {from: authorizedOperator}
            );

            await truffleAssert.reverts(
                clearable.orderTransferFrom(
                    operationId,
                    payer,
                    payee,
                    1,
                    {from: authorizedOperator}
                ),
                'This operationId already exists'
            );
        });

        it('should revert if payer address is zero', async() => {
            await truffleAssert.reverts(
                clearable.orderTransferFrom(
                    operationId,
                    ZERO_ADDRESS,
                    payee,
                    1,
                    {from: authorizedOperator}
                ),
                'Payer address must not be zero address'
            );
        });

        it('should revert if payee address is zero', async() => {
            await truffleAssert.reverts(
                clearable.orderTransferFrom(
                    operationId,
                    payer,
                    ZERO_ADDRESS,
                    1,
                    {from: authorizedOperator}
                ),
                'Payee address must not be zero address'
            );
        });

        it('should revert if value id greater than balance', async() => {
            await truffleAssert.reverts(
                clearable.orderTransferFrom(
                    operationId,
                    payer,
                    payee,
                    4,
                    {from: authorizedOperator}
                )
            );
        });

        it('should revert if operator is not authorized', async() => {
            await truffleAssert.reverts(
                clearable.orderTransferFrom(
                    operationId,
                    payer,
                    payee,
                    1,
                    {from: unauthorizedOperator}
                )
            );
        });

        it('should successfully create a transfer and emit a ClearableTransferOrdered event', async() => {
            const tx = await clearable.orderTransferFrom(
                operationId,
                payer,
                payee,
                1,
                {from: authorizedOperator}
            );

            truffleAssert.eventEmitted(tx, 'ClearableTransferOrdered', (_event) => {
                return _event.orderer === authorizedOperator &&
                    _event.operationId === operationId &&
                    _event.from === payer &&
                    _event.to === payee &&
                    _event.value.toNumber() === 1
                ;
            });
        });
    });

    describe('rejectClearableTransfer', async() => {
        beforeEach(async() => {
            await clearable.orderTransfer(
                operationId,
                payee,
                1,
                {from: payer}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                clearable.rejectClearableTransfer(
                    randomString.generate(),
                    reason,
                    {from: owner}
                ),
                'A transfer can only be rejected in status Ordered or InProcess'
            );
        });

        it('should revert if anybody else instead of the agent call it', async() => {
            await truffleAssert.reverts(
                clearable.rejectClearableTransfer(
                    operationId,
                    reason,
                    {from: payer}
                ),
                'Can only be rejected by the agent'
            );
        });

        it('should be rejectable by the agent and emit a ClearableTransferRejected event', async() => {
            const tx = await clearable.rejectClearableTransfer(
                  operationId,
                  reason,
                  {from: owner}
            );

            truffleAssert.eventEmitted(tx, 'ClearableTransferRejected', (_event) => {
                return _event.orderer === owner &&
                    _event.operationId === operationId &&
                    _event.reason === reason
                ;
            });

           assert.strictEqual((await clearable.balanceOf(payer)).toNumber(), 3);
        });

        it('should revert if it has been already rejected', async() => {
            await clearable.rejectClearableTransfer(
                operationId,
                reason,
                {from: owner}
            );

            await truffleAssert.reverts(
                clearable.rejectClearableTransfer(
                    operationId,
                    reason,
                    {from: owner}
                ),
                'A transfer can only be rejected in status Ordered or InProcess'
            );
        });
    });

    describe('processClearableTransfer', async() => {
        beforeEach(async() => {
            await clearable.orderTransfer(
                operationId,
                payee,
                3,
                {from: payer}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                clearable.processClearableTransfer(
                    randomString.generate(),
                    {from: owner}
                ),
                'A transfer can only be processed in status Ordered'
            );
        });

        it('should revert if called by the payer', async() => {
            await truffleAssert.reverts(
                clearable.processClearableTransfer(
                    operationId,
                    {from: payer}
                ),
                'Can only be processed by the agent'
            );
        });

        it('should revert if called by the payee', async() => {
            await truffleAssert.reverts(
                clearable.processClearableTransfer(
                    operationId,
                    {from: payee}
                ),
                'Can only be processed by the agent'
            );
        });

        it('should revert if the transfer has been rejected', async() => {
            await clearable.rejectClearableTransfer(
                operationId,
                reason,
                {from: owner}
            );

            await truffleAssert.reverts(
                clearable.processClearableTransfer(
                    operationId,
                    {from: owner}
                ),
                'A transfer can only be processed in status Ordered'
            );
        });

        it('should revert if the transfer has been executed', async() => {
            await clearable.executeClearableTransfer(
                operationId,
                {from: owner}
            );

            await truffleAssert.reverts(
                clearable.processClearableTransfer(
                    operationId,
                    {from: owner}
                ),
                'A transfer can only be processed in status Ordered'
            );
        });

        it('should change the status to InProcess and emit a ClearableTransferInProcess event', async() => {
            const tx = await clearable.processClearableTransfer(
                operationId,
                {from: owner}
            );

            truffleAssert.eventEmitted(tx, 'ClearableTransferInProcess', (_event) => {
                return _event.orderer === owner &&
                    _event.operationId === operationId
                ;
            });
            const ClearableTransfer = await clearable.retrieveClearableTransferData(operationId);
            ClearableTransfer.status == InProcess;
        });
    });

    describe('cancelTransfer', async() => {
        beforeEach(async() => {
            await clearable.orderTransfer(
                operationId,
                payee,
                3,
                {from: payer}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                clearable.cancelTransfer(
                    randomString.generate(),
                    {from: payer}
                ),
                'Can only be processed by the payer'
            );
        });

        it('should revert if called by the payee', async() => {
            await truffleAssert.reverts(
                clearable.cancelTransfer(
                    operationId,
                    {from: payee}
                ),
                'Can only be processed by the payer'
            );
        });

        it('should revert if called by the agent', async() => {
            await truffleAssert.reverts(
                clearable.cancelTransfer(
                    operationId,
                    {from: owner}
                ),
                'Can only be processed by the payer'
            );
        });

        it('should revert if the transfer has been rejected', async() => {
            await clearable.rejectClearableTransfer(
                operationId,
                reason,
                {from: owner}
            );

            await truffleAssert.reverts(
                clearable.cancelTransfer(
                    operationId,
                    {from: payer}
                ),
                'A transfer can only be cancelled in status Ordered'
            );
        });

        it('should revert if the transfer has been executed', async() => {
            await clearable.executeClearableTransfer(
                operationId,
                {from: owner}
            );

            await truffleAssert.reverts(
                clearable.cancelTransfer(
                    operationId,
                    {from: payer}
                ),
                'A transfer can only be cancelled in status Ordered'
            );
        });

        it('should change the status to Cancelled and emit a ClearableTransferCancelled event', async() => {
            const tx = await clearable.cancelTransfer(
                operationId,
                {from: payer}
            );

            truffleAssert.eventEmitted(tx, 'ClearableTransferCancelled', (_event) => {
                return _event.orderer === payer &&
                    _event.operationId === operationId
                ;
            });
            const ClearableTransfer = await clearable.retrieveClearableTransferData(operationId);
            ClearableTransfer.status == Cancelled;
        });
    });

    describe('executeClearableTransfer', async() => {
        beforeEach(async() => {
            await clearable.orderTransfer(
                operationId,
                payee,
                3,
                {from: payer}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                clearable.executeClearableTransfer(
                    randomString.generate(),
                    {from: owner}
                ),
                'A transfer can only be executed in status Ordered or InProcess'
            );
        });

        it('should revert if called by the payer', async() => {
            await truffleAssert.reverts(
                clearable.executeClearableTransfer(
                    operationId,
                    {from: payer}
                ),
                'Can only be executed by the agent'
            );
        });

        it('should revert if called by the payee', async() => {
            await truffleAssert.reverts(
                clearable.executeClearableTransfer(
                    operationId,
                    {from: payee}
                ),
                'Can only be executed by the agent'
            );
        });

        it('should revert if the transfer has been rejected', async() => {
            await clearable.rejectClearableTransfer(
                operationId,
                reason,
                {from: owner}
            );

            await truffleAssert.reverts(
                clearable.executeClearableTransfer(
                    operationId,
                    {from: owner}
                ),
                'A transfer can only be executed in status Ordered or InProcess'
            );
        });

        it('should execute the transfer and emit a ClearableTransferExecuted event', async() => {
            const tx = await clearable.executeClearableTransfer(
                operationId,
                {from: owner}
            );

            const balanceOfPayer = await clearable.balanceOf(payer);
            const balanceOfPayee = await clearable.balanceOf(payee);

           assert.strictEqual(balanceOfPayer.toNumber(), 0);
           assert.strictEqual(balanceOfPayee.toNumber(), 3);

            truffleAssert.eventEmitted(tx, 'ClearableTransferExecuted', (_event) => {
                return _event.orderer === owner &&
                    _event.operationId === operationId
                ;
            });
        });
    });

    describe('authorizeClearableTransferOperator', async() => {
        it('should authorize an operator and emit a authorizeClearableTransferOperator event', async() => {
            const tx = await clearable.authorizeClearableTransferOperator(authorizedOperator, {from: payer});

            const isAuthorized = await clearable.isClearableTransferOperatorFor(authorizedOperator, payer);
            assert.strictEqual(isAuthorized, true, 'Operator has not been authorized');

            truffleAssert.eventEmitted(tx, 'AuthorizedClearableTransferOperator', (_event) => {
                return _event.operator === authorizedOperator && _event.account === payer;
            });
        });

        it('should revert if an operator has already been authorized', async() => {
            await clearable.authorizeClearableTransferOperator(authorizedOperator, {from: payer});

            await truffleAssert.reverts(
                clearable.authorizeClearableTransferOperator(authorizedOperator, {from: payer}),
                'The operator is already authorized'
            );
        });
    });

    describe('revokeClearableTransferOperator', async() => {
        it('should revert if an operator has not been authorized', async() => {
            await truffleAssert.reverts(
                clearable.revokeClearableTransferOperator(unauthorizedOperator, {from: payer}),
                'The operator is already not authorized'
            );
        });

        it('should revoke the authorization of an operator and emit a RevokedClearableTransferOperator event', async() => {
            await clearable.authorizeClearableTransferOperator(unauthorizedOperator, {from: payer});

            const tx = await clearable.revokeClearableTransferOperator(unauthorizedOperator, {from: payer});

            const isAuthorized = await clearable.isClearableTransferOperatorFor(authorizedOperator, payer);
            assert.strictEqual(isAuthorized, false, 'Operator authorization has not been revoked');

            truffleAssert.eventEmitted(tx, 'RevokedClearableTransferOperator', (_event) => {
                return _event.operator === unauthorizedOperator && _event.account === payer;
            });
        });
    });

    describe('defineClearableAgent', async() => {
        it('should define a new clearable agent', async() => {
            await clearable.defineClearableAgent(newAgent, {from: owner});
            const isClearableAgent = await clearable.isClearableAgent(newAgent);
            isClearableAgent == true;
        });
    });
});
