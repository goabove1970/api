import { ResponseBase } from './Requests';
import { BusinessCreateArgs } from '@models/business/BusinessCreateArgs';
import { BusinessUpdateArgs } from '@models/business/BusinessUpdateArgs';
import { BusinessDeleteArgs } from '@models/business/BusinessDeleteArgs';
import { BusinessReadArgs } from '@models/business/BusinessReadArgs';

export enum BusinessRequestType {
    Read = 'read',
    Create = 'create',
    Delete = 'delete',
    Update = 'update',
    AddRule = 'add-rule',
}

export interface BusinessRequest {
    action?: BusinessRequestType;
    args?: BusinessCreateArgs & BusinessUpdateArgs & BusinessDeleteArgs & BusinessReadArgs;
}

export interface BusinessResponse extends ResponseBase {
    action?: BusinessRequestType;
}
