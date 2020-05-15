import { Router } from 'express';
import { SessionError } from '../models/errors/errors';
import { BankSyncRequest, BankConnectionResponse } from './request-types/bank-connections-requests';
import bankSyncController from '../controllers/bank-sync-controller';

const router = Router();

const process = async function(req, res) {
    console.log(`Received a request in bank sync controller: ${JSON.stringify(req.body, null, 4)}`);
    const request = req.body as BankSyncRequest;
    if (!request) {
        return res.status(500).send(new SessionError());
    }

    let responseData: BankConnectionResponse = {};

    console.log(`Processing ${request.action} bank sync request`);
    responseData = await bankSyncController.passThrough(request.args, request.action);

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
};

router.get('/', process);
router.post('/', process);

export = router;
