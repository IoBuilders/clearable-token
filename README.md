# Clearable Token

[![Build Status](https://travis-ci.org/IoBuilders/clearable-token.svg?branch=master)](https://travis-ci.org/IoBuilders/clearable-token)
[![Coverage Status](https://coveralls.io/repos/github/IoBuilders/clearable-token/badge.svg?branch=master)](https://coveralls.io/github/IoBuilders/clearable-token?branch=master)
[![npm](https://img.shields.io/npm/v/eip2018.svg)](https://www.npmjs.com/package/eip2018)

This is the reference implementation of [EIP Clearable Token](https://github.com/IoBuilders/EIPs/blob/eip-clearable-token/EIPS/eip-clearable-token.md). This implementation is being implemented by the [iocash](https://io.cash) team in order to propose a standard em-token to the community. This implementation will change over time with the token standard and is not stable at the moment.

Feedback is appreciated and can given at [the discussion of the EIP](https://github.com/ethereum/EIPs/pull/2018/files).

## Summary

> "In banking and finance, clearing denotes all activities from the time a commitment is made for a transaction until it is settled." [[1]][Clearing-Wikipedia] 

## Abstract
The clearing process turns the promise of a transfer into the actual movement of money from one account to another. A clearing agent decides if the transfer can be executed or not. Until the agent verifies the operation, the amount to be transferred is not deducted from the balance of the payer, but neither is it available for another operation and therefore ensures, that the execution of the transfer will be successful when it is executed. 
The Clearable agent can do three things: (1) execute the transfer: the money is transferred to the account that was set as target. (2) reject the transfer: the transfer will not take place and the money will be made available again in the origin account.(3) Mark the transfer as in process for a later decision on what to do with it. The payer can only cancel the transfer if it has not been marked as in process before. 

## Sequence diagrams

### Clearable transfer executed

The following diagram shows the sequence of the clearable transfer creation and execution.

![Clearable Token: Clearable transfer](https://www.plantuml.com/plantuml/img/dP2n3i8m44FtVCMfKnduWGoe1J4mmT1-G6WC0o51bwl4vwEaeaiY1kQp_NpkeXYM-UdK6C4zRNVK71mCcwi33U41tsWARC436nzlu5Q2fgJURrIXJG7z7LuqhQUlyPnIO5M-rq2awSLXGeo5jqxAdIkaaxyiEJzPU6EQ1ILhdI9_gKd-Ad5Sugtgu6rQ-0C0)

### Clearable transfer cancelled by payer

The following diagram shows the sequence of a clearable transfer creation and cancelled by the payer.

![Clearable Token: Clearable transfer cancelled by payer](https://www.plantuml.com/plantuml/img/bP0n3i9040Fxl6AL2We-S0LAo0DemWEMd069pPwqj_a_Tv520qAYjZsst6LdysMMvf9XFHsEr0u2DhuAQ4nFQ1ieMOIDnffli9sdGDLzsZSVtWhexr0Fz9QsuBbI47ysJQmJP4jyvw_vG8QYPT034eddjAZ_jsTOkwGiwg2nVF02)

### Clearable transfer rejected by agent

The following diagram shows the sequence of a clearable transfer creation and rejected by the notary.

![Clearable Token: Clearable transfer rejected by agent](https://www.plantuml.com/plantuml/img/VP113i8m40FlUSMg9pZmWHnG2mz0GkK12p4WI1Dfi_q_tKXmISNPzjXoNvH5vocwIu4CjDjJTunWuMi4ZVcDr7dA4Y2ZS2fto4Qp9tCVjgxn6c1u8Acdd_GDdeo2uAg-saIU12_SjCckDzNDbbcq0deY1k8fpqd_-XlwkPOkqtgaO6Ty0000)

## State diagram

![Clearable Token: State Diagram](https://www.plantuml.com/plantuml/img/dL91JiCm4Bpx5Nj6wWSue4fL3vn0Y1lYiB7N9B2igxM3cjzZkqdQG90gJhOqipEpezt6X9hwJpOlDw-msTp1WpfIShUmOqB5XkbPKQ8d7H4plfLzBuyQBCMumf-nnSJ-IBPFgmOJPEOCANoGH0WU3ZYG0Yf1I-m0nO641FY57HSDy44XZKBc8jO_9IgSMXgdB4ebvzSISqL-kzK5d-YTxFg24_HZuffApfnYxVkIOOhQOeI6IC05eKNPrsGvSygIGNZ8OldFd4MQeVhX6qc2N4zfOscnEpMowZ5ZveBrjqiLFs6TXov29zCvGhxJr4Up9N7bMhy1)

## Install

```
npm install eip2018
```

## Usage

To write your custom contracts, import it and extend it through inheritance.

```solidity
pragma solidity ^0.5.0;

import 'eip2018/contracts/Clearable.sol';

contract MyClearable is Clearable {
    // your custom code
}
```

> You need an ethereum development framework for the above import statements to work! Check out these guides for [Truffle], [Embark] or [Buidler].

## Tests

To run the unit tests a local blockchain, like [Ganache](https://www.trufflesuite.com/ganache) has to be running.  Once it does execute `npm test` to run the tests.

## Code coverage

To run the code coverage simply execute `npm run coverage`

[Truffle]: https://truffleframework.com/docs/truffle/quickstart
[Embark]: https://embark.status.im/docs/quick_start.html
[Buidler]: https://buidler.dev/guides/#getting-started

[1] https://en.wikipedia.org/wiki/Clearing_(finance)

[Clearing-Wikipedia]: https://en.wikipedia.org/wiki/Clearing_(finance)
