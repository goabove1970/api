import { Router } from 'express';

import { SpendingRequestError } from '@models/errors/errors';
import {
    SpendingRequest,
    SpendingResponse,
    SpendingRequestArgs,
} from './request-types/SpendingsRequest';
import { spendingsController } from '@controllers/spendings-controller';
import logger from '../logger';

const router = Router();

async function process(req, res) {
    // logger.info(`Received a request in spending controller: ${JSON.stringify(req.body, null, 4)}`);
    const spendingRequest = req.body as SpendingRequest;
    if (!spendingRequest) {
        return res.status(500).send(new SpendingRequestError());
    }

    let responseData: SpendingResponse = {};
    try {
        switch (spendingRequest.action) {
            case 'read':
                responseData = await processReadSpendingRequest(spendingRequest.args);
                break;

            default:
                return res
                    .status(500)
                    .send(new SpendingRequestError(`Unknown spending request type: ${spendingRequest.action}`));
        }
    } catch (err) {
        return res
            .status(500)
            .send(new SpendingRequestError(`Error processing spending request: ${err.message || err}`));
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
}
router.get('/', process);
router.post('/', process);

function validateReadRequest(args: SpendingRequestArgs): void {
    if (!args.userId) {
        const error = 'Recevied spending request with empty userId';
        logger.error(error);
        throw error;
    }
}

async function processReadSpendingRequest(args: SpendingRequestArgs): Promise<SpendingResponse> {
    logger.info(`Processing read request in spending router`);
    validateReadRequest(args);
    let response: SpendingResponse;
    try {
        response = await spendingsController.processReadSpendingRequest(args);
        return response;
    } catch (error) {
        logger.error(error.message);
        response.error = error.message;
    }
    return response;
}

export = router;
