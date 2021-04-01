import { Router } from 'express';

import sessionServiceController from '@controllers/session-controller/session-service-controller';
import { SessionResponse, SessionRequest, SessionRequestType } from './request-types/session-request';
import { SessionError } from '@models/errors/errors';

const router = Router();

const process = async function(req, res, next) {
    console.log(`Received a request in session controller: ${JSON.stringify(req.body, null, 4)}`);
    const sessionRequest = req.body as SessionRequest;
    if (!sessionRequest) {
        return res.status(500).send(new SessionError());
    }

    let responseData: SessionResponse = {};

    console.log(`Processing ${sessionRequest.action} session request`);
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
    } catch (error) {
        console.error(`Error: ${error.message || error}`);
        return res.status(500).send(new SessionError(error.message || error));
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.send(responseData);
};

router.get('/', process);
router.post('/', process);

export = router;
