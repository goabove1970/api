import { Router } from 'express';

import sessionServiceController from '@controllers/session-controller/session-service-controller';
import { SessionResponse, SessionRequest, SessionRequestType } from './request-types/session-request';
import { SessionError } from '@models/errors/errors';
import { logHelper } from '../logger';
import { inspect } from 'util';

// Function to format session errors into user-friendly messages
function formatSessionError(error: any, errorCode?: number): string {
    if (!error) {
        return 'An error occurred while processing the session request';
    }
    
    let errorMsg = '';
    let errorCodeValue = errorCode;
    
    if (error && typeof error === 'object') {
        errorMsg = (error as any).errorMessage || 
                  (error as any).message || 
                  (error instanceof Error ? error.message : '') || 
                  String(error);
        errorCodeValue = errorCodeValue || (error as any).code || (error as any).errorCode;
    } else if (error instanceof Error) {
        errorMsg = error.message || String(error);
    } else {
        errorMsg = String(error);
    }
    
    // Check for connection errors (session service not available)
    const isConnectionError = String(errorCodeValue) === 'ECONNREFUSED' || 
                             errorMsg.includes('ECONNREFUSED') || 
                             errorMsg.includes('connect') ||
                             errorMsg.includes('timeout') ||
                             errorMsg.includes('ECONNREFUSED ::1:9200') ||
                             errorMsg.includes('ECONNREFUSED 127.0.0.1:9200');
    
    if (isConnectionError) {
        return 'Session service is not available. Please try again later.';
    }
    
    // Clean up error message
    let cleanMsg = errorMsg;
    // Remove common error prefixes
    cleanMsg = cleanMsg.replace(/^Error:\s*/i, '');
    cleanMsg = cleanMsg.replace(/^SessionError:\s*/i, '');
    cleanMsg = cleanMsg.replace(/^AggregateError:\s*/i, '');
    // Remove stack trace-like content
    cleanMsg = cleanMsg.split('\n')[0].trim();
    
    return cleanMsg || 'An error occurred while processing the session request';
}

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
            responseData.error = formatSessionError(responseData.error, responseData.errorCode);
        }
    } catch (error) {
        logHelper.error(`Error: ${inspect(error)}`);
        responseData = {
            action: sessionRequest.action,
            error: formatSessionError(error),
            errorCode: 500,
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
