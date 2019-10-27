import { TransactionRequest, TransactionResponse, ReadTransactionArgs } from './request-types/TransactionRequests';
import { Router } from 'express';
import { TransactionRequestError } from '../models/errors/errors';
import { chaseTransactionReader } from '../controllers/persistence-controller';

import * as moment from 'moment';
import { TransactionReadArg } from '../models/transaction/TransactionReadArgs';

const router = Router();

router.get('/', async function(req, res, next) {
  console.log(`Received a request in transaction controller: ${JSON.stringify(req.body, null, 4)}`);
  const transactionRequest = req.body as TransactionRequest;
  if (!transactionRequest) {
    return res.status(500).send(new TransactionRequestError());
  }

  let responseData: TransactionResponse = {};

  switch (transactionRequest.action) {
    case 'read-transactions':
      console.log(`Processing ${transactionRequest.action} request`);
      responseData = await processReadTransactionsRequest(transactionRequest.args);
  }

  res.send(responseData);
});

async function processReadTransactionsRequest(args: ReadTransactionArgs): Promise<TransactionResponse> {
  const response: TransactionResponse = {
    action: 'read-transactions',
    payload: {},
  };

  const readArgs: TransactionReadArg = {
    startDate: args && args.startDate && moment(args.startDate).toDate(),
    endDate: args && args.endDate && moment(args.endDate).toDate(),
  };
  try {
    const transactions = chaseTransactionReader.readTransactionsArg(readArgs);
    response.payload = {
      count: transactions.length,
      transactions,
    };
  } catch (error) {
    console.error(error.message);
    response.error = error.message;
  }
  return response;
}

export = router;
