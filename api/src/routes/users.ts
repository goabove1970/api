import { Router } from 'express';

import { UserRequest, UserResponse, ReadUserArgs } from './request-types/UserRequests';
import { UserRequestError } from '@models/errors/errors';
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
    return res.status(500).send(new UserRequestError());
  }

  let responseData: UserResponse = {};

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
  console.log(`Processing read-user request`);
  const response: UserResponse = {
    action: 'read-users',
    payload: {},
  };

  let userCollection: DeepPartial<UserDetails>[] = [];
  try {
    if (request.statuses) {
      userCollection = userCollection.concat(
        userController.getUser({
          status: request.statuses,
        })
      );
    } else if (request.login) {
      userCollection.push(userController.getUserByLogin(request.login));
    } else if (request.userId) {
      userCollection.push(userController.getUserById(request.userId));
    } else if (request.email) {
      userCollection.push(userController.getUserByEmail(request.email));
    } else {
      userCollection = userCollection.concat(
        userController.getUser({
          status: undefined,
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
      userId: userController.createUser(request),
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
      userId: userController.deleteUser(request),
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
      userId: userController.updateUserData(request),
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
      userId: userController.updatePassword(request),
    };
  } catch (error) {
    console.error(error.message);
    response.error = error.message;
  }
  return response;
}

export = router;
