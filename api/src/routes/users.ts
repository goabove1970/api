import { Router } from 'express';

import { UserRequest, UserResponse, ReadUserArgs, UserRequestType } from './request-types/UserRequests';
import { UserError } from '@models/errors/errors';
import { DeepPartial } from '@models/DeepPartial';
import userController from '@controllers/user-controller';
import {
    UserUpdatePasswordArgs,
    UserLoginArgs,
    UserLogoutArgs,
    UserExtendSessionArgs,
} from '@models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { ManageAccountArgs } from '@models/user/ManageAccountArgs';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { UserUpdateArgs } from '@models/user/UserUpdateArgs';
import { UserDetails } from '@models/user/UserDetails';
import sessionServiceController from '../controllers/session-controller/session-service-controller';

const router = Router();

const process = async function(req, res, next) {
    console.log(`Received a request in user controller: ${JSON.stringify(req.body, null, 4)}`);
    const userRequest = req.body as UserRequest;
    if (!userRequest) {
        return res.status(500).send(new UserError());
    }

    let responseData: UserResponse = {};
    console.log(`Processing ${userRequest.action} user request`);
    switch (userRequest.action) {
        case UserRequestType.Read:
            responseData = await processReadUsersRequest(userRequest.args);
            break;
        case UserRequestType.Create:
            responseData = await processCreateUserRequest(userRequest.args);
            break;
        case UserRequestType.Delete:
            responseData = await processDeleteUserRequest(userRequest.args);
            break;
        case UserRequestType.Update:
            responseData = await processUpdateUserRequest(userRequest.args);
            break;
        case UserRequestType.UpdatePassword:
            responseData = await processUpdatePasswordRequest(userRequest.args);
            break;
        case UserRequestType.AddAccount:
            responseData = await processAddAccountRequest(userRequest.args);
            break;
        case UserRequestType.RemoveAccount:
            responseData = await processRemoveAccountRequest(userRequest.args);
            break;
        case UserRequestType.Login:
            responseData = await processLoginRequest(userRequest.args);
            break;
        case UserRequestType.Logout:
            responseData = await processLogoutRequest(userRequest.args);
            break;
        case UserRequestType.ExtendSession:
            responseData = await processExtendSessionRequest(userRequest.args);
            break;
    }

    res.send(responseData);
};

router.get('/', process);
router.post('/', process);

async function processRemoveAccountRequest(request: ManageAccountArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.RemoveAccount,
        payload: {},
    };

    try {
        response.payload = {
            userId: await userController.removeAccount(request).catch((error) => {
                throw error;
            }),
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processLoginRequest(request: UserLoginArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.Login,
        payload: {},
    };

    try {
        response.payload = await userController
            .validateUser(request)
            .then((userData: UserDetails) => {
                if (userData !== undefined) {
                    return sessionServiceController
                        .init({
                            userId: userData.userId,
                        })
                        .then((sessionData) => {
                            return {
                                sessionData,
                                userData,
                            };
                        });
                }
                throw 'Could not validate user credentials';
            })
            .then(async ({ sessionData, userData }) => {
                if (sessionData.error) {
                    throw `Could not initilize new session, code: ${sessionData.errorCode}, error: ${sessionData.error}`;
                }
                await userController.updateLastLogin(userData.userId);
                return {
                    ...response.payload,
                    session: sessionData.payload,
                };
            })
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message || error);
        response.error = error.message || error;
    }
    return response;
}

async function processExtendSessionRequest(request: UserExtendSessionArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.ExtendSession,
        payload: {},
    };

    try {
        const session = await sessionServiceController.extend({ sessionId: request.sessionId });
        if (session.error) {
            throw `Can not extend session. Code: ${session.errorCode}. Error message: ${session.error}.`;
        }
        response.payload = {
            session: session.payload,
        };
    } catch (error) {
        console.error(error.message || error);
        response.error = error.message || error;
    }
    return response;
}

async function processLogoutRequest(request: UserLogoutArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.Logout,
        payload: {},
    };

    try {
        response.payload = await sessionServiceController
            .terminate({
                sessionId: request.sessionId,
            })
            .then((r) => r.payload);
    } catch (error) {
        console.error(error.message || error);
        response.error = error.message || error;
    }
    return response;
}

async function processAddAccountRequest(request: ManageAccountArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.AddAccount,
        payload: {},
    };

    try {
        response.payload = {
            userId: await userController.addAccount(request).catch((error) => {
                throw error;
            }),
        };
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processReadUsersRequest(request: ReadUserArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.Read,
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
    const response: UserResponse = {
        action: UserRequestType.Create,
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
    const response: UserResponse = {
        action: UserRequestType.Delete,
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
    const response: UserResponse = {
        action: UserRequestType.Update,
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
    const response: UserResponse = {
        action: UserRequestType.UpdatePassword,
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
