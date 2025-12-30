import { Router } from 'express';

import sessionServiceController from '@controllers/session-controller/session-service-controller';
import { SessionResponse, SessionRequest, SessionRequestType } from './request-types/session-request';
import { SessionError } from '@models/errors/errors';
import { ErrorCode } from '@models/errors/ErrorCodes';
import { formatError } from '@utils/errorFormatter';
import { logHelper } from '../logger';
import { inspect } from 'util';


const router = Router();

const process = async function(req, res, next) {
    // logHelper.info(`Received a request in session controller: ${JSON.stringify(req.body, null, 4)}`);
    const sessionRequest = req.body as SessionRequest;
    if (!sessionRequest) {
        return res.status(500).send(new SessionError());
    }

    let responseData: SessionResponse = {};

    logHelper.info(`Processing ${sessionRequest.action} session request`);
    try {
        switch (sessionRequest.action) {
            case SessionRequestType.Extend:
                responseData = await sessionServiceController.extend(sessionRequest.args);
                break;
            case SessionRequestType.Validate:
                responseData = await sessionServiceController.validate(sessionRequest.args);
                break;
            case SessionRequestType.Init:
                responseData = await sessionServiceController.init(sessionRequest.args);
                break;
            case SessionRequestType.Terminate:
                responseData = await sessionServiceController.terminate(sessionRequest.args);
                break;
        }
        
        // Check if the response from session service has an error
        if (responseData && responseData.error) {
            logHelper.error(`Session service error: ${responseData.error}`);
            const formatted = formatError(responseData.error, ErrorCode.SESSION_SERVICE_UNAVAILABLE);
            responseData.error = formatted.error;
            responseData.errorCode = formatted.errorCode;
        }
    } catch (error) {
        logHelper.error(`Error: ${inspect(error)}`);
        const formatted = formatError(error, ErrorCode.SESSION_SERVICE_UNAVAILABLE);
        responseData = {
            action: sessionRequest.action,
            error: formatted.error,
            errorCode: formatted.errorCode,
        };
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
};

router.get('/', process);
router.post('/', process);

export = router;
