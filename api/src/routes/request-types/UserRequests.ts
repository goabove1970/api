import { UserUpdatePasswordArgs } from '@models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { ResponseBase } from './Requests';
import { UserStatus } from '@models/user/UserStatus';

export type UserRequestType = 'read-users' | 'create-user' | 'delete-user' | 'update-user' | 'update-password';

export interface UserRequest {
    action?: UserRequestType;
    args?: ReadUserArgs & UserCreateArgs & UserUpdatePasswordArgs & UserDeleteArgs;
}

export interface UserResponse extends ResponseBase {
    action?: UserRequestType;
}

export interface ReadUserArgs {
    userId?: string;
    login?: string;
    email?: string;
    statuses?: UserStatus;
}
