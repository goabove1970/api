import { TransactionRequest, TransactionResponse } from "./request-types/transaction-requests";
import { Router } from "express";
import { TransactionRequestError } from "@models/errors/errors";
import { chaseTransactionReader } from "../controllers/persistence-controller";
import { TransactionReadArg } from "@models/transaction/TransactionReadArgs";
import * as moment from "moment";

const router = Router();

router.get("/", async function(req, res, next) {
  console.log(`Received a requst in transaction controller: ${JSON.stringify(req.body, null, 4)}`);
  const transactionRequest = req.body as TransactionRequest;
  if (!transactionRequest) {
    return res.status(500).send(new TransactionRequestError());
  }

  let responseData: TransactionResponse = {};

  switch (transactionRequest.action) {
    case "read-transactions":
      console.log(`Processing ${transactionRequest.action} request`);
      responseData = await processReadTransactionsRequest(transactionRequest);
  }

  res.send(responseData);
});

async function processReadTransactionsRequest(request: TransactionRequest): Promise<TransactionResponse> {
  const response: TransactionResponse = {
    action: "read-transactions",
    payload: {}
  };

  const readArgs: TransactionReadArg = {
    startDate: request.args && request.args.startDate && moment(request.args.startDate).toDate(),
    // endDate: request.args && request.args.endDate && moment(request.args.endDate).add(24, 'hours').toDate()
    endDate: request.args && request.args.endDate && moment(request.args.endDate).toDate()
  };

  const transactions = chaseTransactionReader.readTransactionsArg(readArgs);
  response.payload = {
    count: transactions.length,
    transactions
  };
  return response;
}

export = router;
