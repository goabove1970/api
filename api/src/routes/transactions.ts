import {
    TransactionRequest,
    TransactionResponse,
    TransactionRequestType,
    TransactionImportArgs,
    TransactioCsvFileImportArgs,
    TransactionDeleteArgs,
    TryRegexParseArgs,
    UpdateTransactionArgs,
    TransactionsImportArgs,
    TransactionsDeleteArgs,
} from './request-types/TransactionRequests';
import { Router } from 'express';
import { TransactionError } from '@models/errors/errors';
import { isHiddenTransaction, isExcludedFromBalanceTransaction } from '@utils/transUtils';
import * as moment from 'moment';
import { TransactionReadArg } from '@models/transaction/TransactionReadArgs';
import categoryController from '../controllers/category-controller';
import { GuidEight } from '../utils/generateGuid';
import { inspect } from 'util';
import userController from '../controllers/user-controller';
import { Transaction, TransactionUpdateArgs } from '../models/transaction/transaction';
import { transactionController } from '../controllers/transaction-controller/TransactionController';
import { logHelper } from '../logger';
var multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');

const router = Router();

const process = async function(req, res, next) {
    // logHelper.info(`Received a request in transaction controller: ${JSON.stringify(req.body, null, 4)}`);
    const transactionRequest = req.body as TransactionRequest;
    if (!transactionRequest) {
        return res.status(500).send(new TransactionError());
    }

    let responseData: TransactionResponse = {};
    logHelper.info(`Processing ${transactionRequest.action} request: ${inspect(transactionRequest.args)}`);

    switch (transactionRequest.action) {
        case TransactionRequestType.ImportTransactions:
            responseData = await processImportTransactionsRequest(transactionRequest.args as TransactionsImportArgs);
            break;
        case TransactionRequestType.ReadTransactions:
            responseData = await processReadTransactionsRequest(transactionRequest.args as TransactionReadArg);
            break;
        case TransactionRequestType.ImportTransaction:
            responseData = await processImportTransactionRequest(transactionRequest.args as TransactionImportArgs);
            break;
        case TransactionRequestType.Delete:
            responseData = await processDeleteTransactionRequest(transactionRequest.args as TransactionDeleteArgs);
            break;
        case TransactionRequestType.DeleteTransactions:
            responseData = await processDeleteTransactionsRequest(transactionRequest.args as TransactionsDeleteArgs);
            break;
        case TransactionRequestType.ImportTransactionCsvFile:
            responseData = await processImportTransactionFileRequest(
                transactionRequest.args as TransactioCsvFileImportArgs
            );
            break;
        case TransactionRequestType.TestRegex:
            responseData = await processTestRegexRequest(transactionRequest.args as TryRegexParseArgs);
            break;
        case TransactionRequestType.TestBusinessRegex:
            responseData = await processTestBusinessRegexRequest(transactionRequest.args as TryRegexParseArgs);
            break;
        case TransactionRequestType.Recognize:
            responseData = await processRecognizeRequest();
            break;
        case TransactionRequestType.Update:
            responseData = await processUpdateTransactionRequest(transactionRequest.args as UpdateTransactionArgs);
            break;
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
};

router.post('/', process);
router.get('/', process);
router.post('/upload/*', processUploadRequest);

async function processUpdateTransactionRequest(args: UpdateTransactionArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = { action: TransactionRequestType.Update, payload: {} };

    const updateTransactionArgs: TransactionUpdateArgs = {
        categoryId: args.categoryId,
        transactionId: args.transactionId,
        statusModification: args.statusModification,
        businessId: args.businessId,
        transactionStatus: args.transactionStatus,
    };

    try {
        await transactionController.update(updateTransactionArgs);
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processReadTransactionsRequest(args: TransactionReadArg): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.ReadTransactions,
        payload: {},
    };

    let accounts = args.accountId ? [args.accountId] : [];
    if (args.userId) {
        accounts = [];
        const accts = await userController.getUserAccountLinks({
            userId: args.userId,
        });
        accounts = accts.map((u) => u.accountId);
    }

    const readArgs: TransactionReadArg = {
        startDate: args && args.startDate && moment(args.startDate).toDate(),
        endDate: args && args.endDate && moment(args.endDate).toDate(),
        accountIds: accounts,
        categorization: args.categorization,
        filter: args.filter,
        reloadTransactions: args.reloadTransactions,
    };
    try {
        // console.log(`read transaction args: ${inspect(readArgs)}`);
        const transactionsReadResult = await transactionController.read(readArgs);
        if (args.countOnly) {
            const number = transactionsReadResult as number;
            response.payload = {
                count: number,
            };
        } else {
            // console.log(`read transaction results: ${inspect(transactionsReadResult)}`);
            const transactions = transactionsReadResult as Transaction[];
            response.payload = {
                count: transactions.length,
                transactions: transactions.map((t) => {
                    return {
                        ...t,
                        isHidden: isHiddenTransaction(t),
                        isExcluded: isExcludedFromBalanceTransaction(t),
                    };
                }),
            };
            if (args.filter) {
                response.payload.filter = args.filter;
            }
            if (args.categoryId) {
                const categories = await categoryController.read({ userId: args.userId });
                const categoriesSet = new Set<string>();
                categoriesSet.add(args.categoryId);
                categories.forEach((c) => {
                    if (c.parentCategoryId === args.categoryId) {
                        if (!categoriesSet.has(c.categoryId)) {
                            categoriesSet.add(c.categoryId);
                        }
                    }
                });
                response.payload.transactions = (response.payload.transactions || []).filter((t: Transaction) => {
                    return categoriesSet.has(t.categoryId);
                });
            }
        }
    } catch (error) {
        logHelper.error(error.message);
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
        const importResult = await transactionController.addTransaction(args.transaction, args.accountId);
        response.payload = {
            ...importResult,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processImportTransactionsRequest(args: TransactionsImportArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.ImportTransaction,
        payload: {},
    };

    if (!args.accountId) {
        const errorMessage = `Can not import transactions if no accountId passed`;
        logHelper.error(errorMessage);
        response.error = errorMessage;
        return response;
    }

    try {
        const importResult = await transactionController.addTransactions(args.transactions, args.accountId);
        response.payload = {
            ...importResult,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processDeleteTransactionRequest(args: TransactionDeleteArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.Delete,
        payload: {},
    };

    try {
        const transactionId = await transactionController.delete(args);
        response.payload = {
            transactionId,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processDeleteTransactionsRequest(args: TransactionsDeleteArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.Delete,
        payload: {},
    };

    try {
        const transactionId = await transactionController.deleteTransactions(args);
        response.payload = {
            transactionId,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processImportTransactionFileRequest(args: TransactioCsvFileImportArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.ImportTransaction,
        payload: {},
    };

    if (!args.accountId) {
        throw 'Can not import transactions to empty accountId';
    }

    try {
        const addResult = await transactionController.importTransactionsFromCsv(args.file, args.accountId);
        response.payload = {
            addResult,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processUploadRequest(req, res, next) {
    let parts = req.originalUrl && req.originalUrl.split('/');
    let acct = '';
    if (parts.length > 0) {
        acct = parts[parts.length - 1];
    }
    logHelper.info(`Acct: ${acct}`);
    var form = new multiparty.Form();
    var count = 0;
    let tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }
    tmpDir = './tmp/fileUploads';
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    } else {
        //Todo: delete old files
    }
    const fileName = path.join(tmpDir, `${GuidEight()}.tmp`);

    form.on('error', function(err) {
        logHelper.info('Error parsing form: ' + err.stack);
    });
    form.on('part', function(part) {
        if (!part.filename) {
            logHelper.info('got field named ' + part.name);
            part.resume();
        }

        if (part.filename) {
            const w = fs.createWriteStream(fileName);
            part.pipe(w);
            count++;
            part.resume();
        }

        part.on('error', function(err) {
            logHelper.error(`Error receiving transactions file: ${err.message || err}`);
        });
    });

    form.on('close', function() {
        logHelper.info('Upload completed!');
        fs.readFile(fileName, (error, data) => {
            if (error) {
                throw 'Error processing transaction file';
            }
            const dataStr = data.toString();
            processImportTransactionFileRequest({
                file: dataStr,
                accountId: acct,
            })
                .then((importRes: any) => {
                    logHelper.info(inspect(importRes));
                    res.send(importRes);
                })
                .catch(() => {
                    logHelper.error('Error processing transaction file received');
                    res.end('Received ' + count + ' files');
                });
        });
    });

    form.parse(req);
}

async function processTestRegexRequest(args: TryRegexParseArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.TestRegex,
        payload: {},
    };

    try {
        const addResult = await transactionController.testRegex(args.regex);
        response.payload = {
            count: addResult.length,
            matchingTransactions: addResult,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processTestBusinessRegexRequest(args: TryRegexParseArgs): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.TestBusinessRegex,
        payload: {},
    };

    try {
        const addResult = await transactionController.testBusinessRegex(args.businessId);
        response.payload = {
            count: addResult.length,
            matchingTransactions: addResult,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processRecognizeRequest(): Promise<TransactionResponse> {
    const response: TransactionResponse = {
        action: TransactionRequestType.Recognize,
        payload: {},
    };

    try {
        const addResult = await transactionController.recognize();
        response.payload = {
            count: addResult.length,
            matchingTransactions: addResult,
        };
    } catch (error) {
        logHelper.error(error.message);
        response.error = error.message;
    }
    return response;
}

export = router;
