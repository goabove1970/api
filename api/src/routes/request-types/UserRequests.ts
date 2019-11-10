import { UserUpdatePasswordArgs } from '@models/user/UserUpdatePasswordArgs';
import { UserDeleteArgs } from '@models/user/UserDeleteArgs';
import { ManageAccountArgs } from "@models/user/ManageAccountArgs";
import { UserCreateArgs } from '@models/user/UserCreateArgs';
import { ResponseBase } from './Requests';
import { UserStatus } from '@models/user/UserStatus';

export enum UserRequestType {
    Read = 'read',
    Create = 'create',
    Delete = 'delete',
    Update = 'update',
    UpdatePassword = 'update-password',
    AddAccount = 'add-account',
    RemoveAccount = 'remove-account',
}

export interface UserRequest {
    action?: UserRequestType;
    args?: ReadUserArgs & UserCreateArgs & UserUpdatePasswordArgs & UserDeleteArgs & ManageAccountArgs;
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
