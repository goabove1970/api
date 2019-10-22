"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errors_1 = require("../models/errors/errors");
const persistence_controller_1 = require("../controllers/persistence-controller");
const moment = require("moment");
const router = express_1.Router();
router.get('/', async function (req, res, next) {
    console.log(`Received a requst in transaction controller: ${JSON.stringify(req.body, null, 4)}`);
    const transactionRequest = req.body;
    if (!transactionRequest) {
        return res.status(500).send(new errors_1.TransactionRequestError());
    }
    let responseData = {};
    switch (transactionRequest.action) {
        case 'read-transactions':
            console.log(`Processing ${transactionRequest.action} request`);
            responseData = await processReadTransactionsRequest(transactionRequest);
    }
    res.send(responseData);
});
async function processReadTransactionsRequest(request) {
    const response = {
        action: 'read-transactions',
        payload: {}
    };
    const readArgs = {
        startDate: request.args && request.args.startDate && moment(request.args.startDate).toDate(),
        endDate: request.args && request.args.endDate && moment(request.args.endDate).toDate()
    };
    const transactions = persistence_controller_1.chaseTransactionReader.readTransactionsArg(readArgs);
    response.payload = {
        count: transactions.length,
        transactions,
    };
    return response;
}
module.exports = router;
//# sourceMappingURL=transactions.js.map