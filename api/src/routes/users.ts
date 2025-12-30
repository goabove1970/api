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
import sessionServiceController from '@controllers/session-controller/session-service-controller';
import { logHelper } from '../logger';
import { inspect } from 'util';

const router = Router();

const process = async function(req, res, next) {
    // logHelper.info(`Received a request in user controller: ${JSON.stringify(req.body, null, 4)}`);
    const userRequest = req.body as UserRequest;
    if (!userRequest) {
        return res.status(500).send(new UserError());
    }

    let responseData: UserResponse = {};
    logHelper.info(`Processing ${userRequest.action} user request`);
    switch (userRequest.action) {
        case UserRequestType.Read:
        case 'read-users' as any: // Support both 'read' and 'read-users' for backward compatibility
            responseData = await processReadUsersRequest(userRequest.args, userRequest.action);
            break;
        case UserRequestType.Create:
        case 'create-user' as any: // Support both 'create' and 'create-user' for backward compatibility
            responseData = await processCreateUserRequest(userRequest.args, userRequest.action);
            break;
        case UserRequestType.Delete:
            responseData = await processDeleteUserRequest(userRequest.args);
            break;
        case UserRequestType.Update:
        case 'update-user' as any: // Support both 'update' and 'update-user' for backward compatibility
            responseData = await processUpdateUserRequest(userRequest.args, userRequest.action);
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

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'content-type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
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
        await userController.removeAccount(request).catch((error) => {
            throw error;
        });
        // Return success with the userId and accountId that were unlinked
        response.payload = {
            userId: request.userId,
            accountId: request.accountId,
            message: 'Account unlinked from user successfully',
        };
    } catch (error) {
        logHelper.error(inspect(error));
        // Format error message to be more user-friendly
        if (error && typeof error === 'object' && 'errorMessage' in error) {
            response.error = (error as any).errorMessage || 'An error occurred while unlinking the account from the user';
        } else if (error instanceof Error) {
            response.error = error.message || 'An error occurred while unlinking the account from the user';
        } else {
            response.error = String(error) || 'An error occurred while unlinking the account from the user';
        }
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
        logHelper.error(error);
        response.error = inspect(error);
    }
    return response;
}

async function processExtendSessionRequest(request: UserExtendSessionArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.ExtendSession,
        payload: {},
    };

    logHelper.info(`processExtendSessionRequest: Processing ${response.action} request`);
    try {
        const session = await sessionServiceController.extend({ sessionId: request.sessionId }).catch((e) => {
            logHelper.error(e);
            throw e;
        });
        if (session.error) {
            throw `Can not extend session. Code: ${session.errorCode}. Error message: ${session.error}.`;
        }
        response.payload = {
            session: session.payload,
        };
    } catch (error) {
        logHelper.error(error);
        response.error = inspect(error);
    }
    logHelper.info(`processExtendSessionRequest: Processing ${response.action} request complete`);
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
        logHelper.error(error);
        response.error = inspect(error);
    }
    return response;
}

async function processAddAccountRequest(request: ManageAccountArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.AddAccount,
        payload: {},
    };

    try {
        await userController.addAccount(request).catch((error) => {
            throw error;
        });
        // Return success with the userId and accountId that were linked
        response.payload = {
            userId: request.userId,
            accountId: request.accountId,
            message: 'Account linked to user successfully',
        };
    } catch (error) {
        logHelper.error(inspect(error));
        // Format error message to be more user-friendly
        if (error && typeof error === 'object' && 'errorMessage' in error) {
            response.error = (error as any).errorMessage || 'An error occurred while linking the account to the user';
        } else if (error instanceof Error) {
            response.error = error.message || 'An error occurred while linking the account to the user';
        } else {
            response.error = String(error) || 'An error occurred while linking the account to the user';
        }
    }
    return response;
}

async function processReadUsersRequest(request: ReadUserArgs, originalAction?: string): Promise<UserResponse> {
    const response: UserResponse = {
        action: (originalAction as UserRequestType) || UserRequestType.Read,
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
            const user = await userController.getUserByLogin(request.login).catch((error) => {
                throw error;
            });
            if (user) {
                userCollection.push(user);
            }
        } else if (request.userId) {
            const user = await userController.getUserById(request.userId).catch((error) => {
                throw error;
            });
            if (user) {
                userCollection.push(user);
            }
        } else if (request.email) {
            const user = await userController.getUserByEmail(request.email).catch((error) => {
                throw error;
            });
            if (user) {
                userCollection.push(user);
            }
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

        // Filter out any null/undefined values
        const validUsers = userCollection.filter((user) => user != null);
        
        response.payload = {
            count: validUsers.length,
            users: validUsers,
        };
    } catch (error) {
        logHelper.error(error);
        response.error = inspect(error);
    }
    return response;
}

async function processCreateUserRequest(request: UserCreateArgs, originalAction?: string): Promise<UserResponse> {
    const response: UserResponse = {
        action: (originalAction as UserRequestType) || UserRequestType.Create,
        payload: {},
    };

    try {
        response.payload = {
            userId: await userController.create(request).catch((error) => {
                throw error;
            }),
        };
    } catch (error) {
        logHelper.error(inspect(error));
        // Format error message to be more user-friendly
        if (error && typeof error === 'object' && 'errorMessage' in error) {
            response.error = (error as any).errorMessage || 'An error occurred while creating the user';
        } else if (error instanceof Error) {
            response.error = error.message || 'An error occurred while creating the user';
        } else {
            response.error = String(error) || 'An error occurred while creating the user';
        }
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
        logHelper.error(error);
        response.error = inspect(error);
    }
    return response;
}

async function processUpdateUserRequest(request: UserUpdateArgs, originalAction?: string): Promise<UserResponse> {
    const response: UserResponse = {
        action: (originalAction as UserRequestType) || UserRequestType.Update,
        payload: {},
    };
    try {
        await userController.updateUserData(request).catch((error) => {
            throw error;
        });
        // Return success with the userId that was updated
        response.payload = {
            userId: request.userId,
            message: 'User updated successfully',
        };
    } catch (error) {
        logHelper.error(inspect(error));
        // Format error message to be more user-friendly
        if (error && typeof error === 'object' && 'errorMessage' in error) {
            response.error = (error as any).errorMessage || 'An error occurred while updating the user';
        } else if (error instanceof Error) {
            response.error = error.message || 'An error occurred while updating the user';
        } else {
            response.error = String(error) || 'An error occurred while updating the user';
        }
    }
    return response;
}

async function processUpdatePasswordRequest(request: UserUpdatePasswordArgs): Promise<UserResponse> {
    const response: UserResponse = {
        action: UserRequestType.UpdatePassword,
        payload: {},
    };

    try {
        await userController.updatePassword(request).catch((error) => {
            throw error;
        });
        // Return success with the userId that was updated
        response.payload = {
            userId: request.userId,
            message: 'Password updated successfully',
        };
    } catch (error) {
        logHelper.error(inspect(error));
        // Format error message to be more user-friendly
        if (error && typeof error === 'object' && 'errorMessage' in error) {
            response.error = (error as any).errorMessage || 'An error occurred while updating the password';
        } else if (error instanceof Error) {
            response.error = error.message || 'An error occurred while updating the password';
        } else {
            response.error = String(error) || 'An error occurred while updating the password';
        }
    }
    return response;
}

export = router;
