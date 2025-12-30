import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { ManageAccountArgs } from '@models/user/ManageAccountArgs';
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { ResponseBase } from './Requests';
import { UserStatus } from '@models/user/UserStatus';
import { SessionArgs } from './session-request';
import {
    UserUpdatePasswordArgs,
    UserLoginArgs,
    UserLogoutArgs,
    UserExtendSessionArgs,
} from '@models/user/UserUpdatePasswordArgs';

export enum UserRequestType {
    Read = 'read',
    Create = 'create',
    Delete = 'delete',
    Update = 'update',
    UpdatePassword = 'update-password',
    AddAccount = 'add-account',
    RemoveAccount = 'remove-account',
    Login = 'login',
    Logout = 'logout',
    ExtendSession = 'extend-session',
}

export interface UserRequest {
    action?: UserRequestType;
    args?: ReadUserArgs &
        UserCreateArgs &
        UserUpdatePasswordArgs &
        UserDeleteArgs &
        ManageAccountArgs &
        SessionArgs &
        UserLoginArgs &
        UserExtendSessionArgs &
        UserLogoutArgs;
}

export interface UserResponse extends ResponseBase {
    action?: UserRequestType;
    /** Session expiration date/time. Present in session-related responses (login, extend-session) when session is active */
    sessionExpires?: Date | string;
}

export interface ReadUserArgs {
    userId?: string;
    login?: string;
    email?: string;
    statuses?: UserStatus;
}
