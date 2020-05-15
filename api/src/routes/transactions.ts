import { TransactionRequest, TransactionResponse } from './request-types/TransactionRequests';
import { Router } from 'express';
import { TransactionError } from '@models/errors/errors';
import transactionPassThrough from '../controllers/transaction-processor-controller';

const router = Router();

const passThourgh = async function(req, res) {
    console.log(`Received a request in bank sync controller: ${JSON.stringify(req.body, null, 4)}`);
    const request = req.body as TransactionRequest;
    if (!request) {
        return res.status(500).send(new TransactionError());
    }
    let responseData: TransactionResponse = {};
    console.log(`Processing ${request.action} transaction request`);
    responseData = await transactionPassThrough.passThrough(request.args, request.action);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
};

router.post('/', passThourgh);
router.get('/', passThourgh);

export = router;
