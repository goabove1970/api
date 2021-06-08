import { Router } from 'express';
import { BankServiceError } from '@models/errors/errors';
import { BankSyncRequest, BankConnectionResponse } from './request-types/bank-connections-requests';
import bankSyncController from '@controllers/bank-sync-controller';
import { logHelper } from '../logger';
import { inspect } from 'util';

const router = Router();

const process = async function(req, res) {
    // logHelper.info(`Received a request in bank sync controller: ${JSON.stringify(req.body, null, 4)}`);
    const request = req.body as BankSyncRequest;
    if (!request) {
        return res.status(500).send(new BankServiceError());
    }

    let responseData: BankConnectionResponse = {};

    logHelper.info(`Processing ${request.action} bank sync request`);
    try {
        responseData = await bankSyncController.passThrough(request.args, request.action);
    } catch (error) {
        const message = `Error while processing bank service request: ${error.message || error}, original request: ${inspect(request)}`;
        logHelper.error(message);
        logHelper.error(message);
        return res.status(500).send(new BankServiceError(message));
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
};

router.get('/', process);
router.post('/', process);

export = router;
