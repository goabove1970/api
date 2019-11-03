import { Router } from 'express';

import { UserRequest, UserResponse, ReadUserArgs } from './request-types/UserRequests';
import { UserError } from '@models/errors/errors';
import { DeepPartial } from '@models/DeepPartial';
import userController from '@controllers/user-controller';
import { UserUpdatePasswordArgs } from '@models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { UserUpdateArgs } from '@models/user/UserUpdateArgs';
import { UserDetails } from '@models/user/UserDetails';

const router = Router();

router.get('/', async function(req, res, next) {
    console.log(`Received a request in user controller: ${JSON.stringify(req.body, null, 4)}`);
    const userRequest = req.body as UserRequest;
    if (!userRequest) {
        return res.status(500).send(new UserError());
    }

    let responseData: UserResponse = {};

    console.log(`Processing ${userRequest.action} user request`);
    switch (userRequest.action) {
        case 'read-users':
            responseData = await processReadUsersRequest(userRequest.args);
            break;
        case 'create-user':
            responseData = await processCreateUserRequest(userRequest.args);
            break;
        case 'delete-user':
            responseData = await processDeleteUserRequest(userRequest.args);
            break;
        case 'update-user':
            responseData = await processUpdateUserRequest(userRequest.args);
            break;
        case 'update-password':
            responseData = await processUpdatePasswordRequest(userRequest.args);
            break;
    }

    res.send(responseData);
});

async function processReadUsersRequest(request: ReadUserArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: 'read-users',
        payload: {},
    };

    let userCollection: DeepPartial<UserDetails>[] = [];
    try {
        if (request.statuses) {
            userCollection = userCollection.concat(
                await userController
                    .read({
                        status: request.statuses,
                    })
                    .catch((error) => {
                        throw error;
                    })
            );
        } else if (request.login) {
            userCollection.push(
                await userController.getUserByLogin(request.login).catch((error) => {
                    throw error;
                })
            );
        } else if (request.userId) {
            userCollection.push(
                await userController.getUserById(request.userId).catch((error) => {
                    throw error;
                })
            );
        } else if (request.email) {
            userCollection.push(
                await userController.getUserByEmail(request.email).catch((error) => {
                    throw error;
                })
            );
        } else {
            userCollection = userCollection.concat(
                await userController
                    .read({
                        status: undefined,
                    })
                    .catch((error) => {
                        throw error;
                    })
            );
        }

        response.payload = {
            count: userCollection.length,
            users: userCollection,
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processCreateUserRequest(request: UserCreateArgs): Promise<UserResponse> {
    console.log(`Processing create-user request`);
    const response: UserResponse = {
        action: 'create-user',
        payload: {},
    };

    try {
        response.payload = {
            userId: await userController.create(request).catch((error) => {
                throw error;
            }),
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processDeleteUserRequest(request: UserDeleteArgs): Promise<UserResponse> {
    console.log(`Processing delete-user request`);
    const response: UserResponse = {
        action: 'delete-user',
        payload: {},
    };

    try {
        response.payload = {
            userId: await userController.delete(request).catch((error) => {
                throw error;
            }),
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processUpdateUserRequest(request: UserUpdateArgs): Promise<UserResponse> {
    console.log(`Processing update-user request`);
    const response: UserResponse = {
        action: 'update-user',
        payload: {},
    };
    try {
        response.payload = {
            userId: await userController.updateUserData(request).catch((error) => {
                throw error;
            }),
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processUpdatePasswordRequest(request: UserUpdatePasswordArgs): Promise<UserResponse> {
    console.log(`Processing update-password request`);
    const response: UserResponse = {
        action: 'update-password',
        payload: {},
    };

    try {
        response.payload = {
            userId: await userController.updatePassword(request).catch((error) => {
                throw error;
            }),
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

export = router;
