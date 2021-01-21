import { DeepPartial } from '@models/DeepPartial';
import { Business } from '@models/business/Business';
import { BusinessReadArgs } from '@models/business/BusinessReadArgs';
import { BusinessCreateArgs } from '@models/business/BusinessCreateArgs';
import { BusinessUpdateArgs } from '@models/business/BusinessUpdateArgs';
import { BusinessDeleteArgs } from '@models/business/BusinessDeleteArgs';
import { AddRuleArgs } from '@models/business/AddRuleArgs';

export abstract class BusinessPersistanceControllerReadonlyBase {
    abstract read(args: BusinessReadArgs): Promise<DeepPartial<Business>[]>;
}

export abstract class BusinessPersistanceControllerBase extends BusinessPersistanceControllerReadonlyBase {
    abstract addRule(request: AddRuleArgs): Promise<void>;
    abstract create(args: BusinessCreateArgs): Promise<string>;
    abstract update(args: BusinessUpdateArgs): Promise<void>;
    abstract delete(args: BusinessDeleteArgs): Promise<void>;
}
