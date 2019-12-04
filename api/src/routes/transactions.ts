import {
    TransactionRequest,
    TransactionResponse,
    ReadTransactionArgs,
    TransactionRequestType,
    TransactionImportArgs,
    TransactioCsvFileImportArgs,
} from './request-types/TransactionRequests';
import { Router } from 'express';
import { TransactionError } from '@models/errors/errors';

import * as moment from 'moment';
import { TransactionReadArg } from '@models/transaction/TransactionReadArgs';
import { transactionProcessor } from '../controllers/transaction-processor-controller/TransactionProcessor';
import { Transaction } from '../models/transaction/Transaction';

const router = Router();

router.get('/', async function(req, res, next) {
    console.log(`Received a request in transaction controller: ${JSON.stringify(req.body, null, 4)}`);
    const transactionRequest = req.body as TransactionRequest;
    if (!transactionRequest) {
        return res.status(500).send(new TransactionError());
    }

    let responseData: TransactionResponse = {};
    console.log(`Processing ${transactionRequest.action} request`);
    switch (transactionRequest.action) {
        case TransactionRequestType.ReadTransactions:
            responseData = await processReadTransactionsRequest(transactionRequest.args as ReadTransactionArgs);
            break;
        case TransactionRequestType.ImportTransaction:
            responseData = await processImportTransactionRequest(transactionRequest.args as TransactionImportArgs);
            break;
        case TransactionRequestType.ImportTransactionCsvFile:
            responseData = await processImportTransactionFileRequest(
                transactionRequest.args as TransactioCsvFileImportArgs
            );
            break;
    }

    res.send(responseData);
});

async function processReadTransactionsRequest(args: ReadTransactionArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.ReadTransactions,
        payload: {},
    };

    const readArgs: TransactionReadArg = {
        startDate: args && args.startDate && moment(args.startDate).toDate(),
        endDate: args && args.endDate && moment(args.endDate).toDate(),
        accountId: args.accountId,
    };
    try {
        const transactionsReadResult = await transactionProcessor.read(readArgs);
        if (args.countOnly) {
            const number = transactionsReadResult as number;
            response.payload = {
                count: number,
            };
        } else {
            const transactions = transactionsReadResult as Transaction[];
            response.payload = {
                count: transactions.length,
                transactions,
            };
        }
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processImportTransactionRequest(args: TransactionImportArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.ImportTransaction,
        payload: {},
    };

    try {
        const transactionId = await transactionProcessor.addTransaction(args.transaction, args.accountId);
        response.payload = {
            transactionId,
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processImportTransactionFileRequest(args: TransactioCsvFileImportArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.ImportTransaction,
        payload: {},
    };

    try {
        const transactionId = await transactionProcessor.importTransactionsFromCsv(args.file, args.accountId);
        response.payload = {
            transactionId,
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

export = router;
