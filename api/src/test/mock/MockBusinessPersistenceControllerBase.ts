import { DeepPartial } from '@models/DeepPartial';
import { DatabaseError } from '@models/errors/errors';
import 'jest';
import { Business } from '@models/business/Business';
import { BusinessCreateArgs } from '@models/business/BusinessCreateArgs';
import { BusinessReadArgs } from '@models/business/BusinessReadArgs';
import { BusinessUpdateArgs } from '@models/business/BusinessUpdateArgs';
import { BusinessDeleteArgs } from '@models/business/BusinessDeleteArgs';
import { BusinessPersistenceController } from '@controllers/data-controller/business/BusinessPersistenceController';
import { AddRuleArgs } from '@models/business/AddRuleArgs';
import { combineNewBusiness, toShortBusinessDetails, validateAddRuleArgs } from '@controllers/data-controller/business/helper';

export const mockableBusinessArgs: { businesses: Business[] } = {
    businesses: [],
};

const getCollection: () => Business[] = () => {
    return mockableBusinessArgs.businesses;
};

const updateItem = (item: Business) => {
    const index = getCollection().findIndex((e) => e.businessId === item.businessId);
    if (index !== -1) {
        getCollection()[index] = item;
    }
};

const deleteBusiness = (businessId: string) => {
    const index = getCollection().findIndex((e) => e.businessId === businessId);
    if (index > -1) {
        getCollection().splice(index, 1);
    }
};

const mock_validateCreateBusinessArgs = (args: BusinessCreateArgs): Promise<void> => {
    if (!args.name) {
        throw new DatabaseError('Business name can not be empty');
    }

    return mock_read({ name: args.name })
        .then((business) => {
            if (business && business.length > 0) {
                throw {
                    message: 'Business with this name already exists',
                };
            }
            return Promise.resolve();
        })
        .catch((error) => {
            throw error;
        });
};

const mock_matchesReadArgs = (b: Business, args: BusinessReadArgs) => {
    if (!args) {
        return false;
    }
    if (args.businessId) {
        return args.businessId == b.businessId;
    }
    if (args.name) {
        return args.name == b.name;
    }
    return false;
};

const mock_validateBusinessUpdateArgs = (args: BusinessUpdateArgs): Promise<void> => {
    if (!args) {
        throw {
            message: 'Can not update Business, no arguments passed',
        };
    }
    if (!args.businessId) {
        throw {
            message: 'Can not update Business, no businessId passed',
        };
    }
    return mock_validateCreateBusinessArgs(args);
};

const mock_read = jest.fn(
    (args: BusinessReadArgs): Promise<DeepPartial<Business>[]> => {
        const filtered = getCollection().filter((b) => mock_matchesReadArgs(b, args))
            .map(toShortBusinessDetails);
        return Promise.resolve(filtered);
    }
);

const mock_findBusinessImpl = jest.fn(
    (businessId: string): Promise<Business | undefined> => {
        const filtered = getCollection().filter((c) => c.businessId === businessId);
        return Promise.resolve(filtered && filtered.length > 0 ? filtered[0] : undefined);
    }
);

const mock_create = jest.fn(
    (args: BusinessCreateArgs): Promise<string> => {
        const a = combineNewBusiness(args);
        return mock_validateCreateBusinessArgs(args)
            .then(() => {
                return getCollection().push(a);
            })
            .then(() => {
                return a.businessId;
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_update = jest.fn(
    (args: BusinessUpdateArgs): Promise<void> => {
        return mock_validateBusinessUpdateArgs(args)
            .then(() => {
                return mock_findBusinessImpl(args.businessId);
            })
            .then((business) => {
                if (!business) {
                    throw new DatabaseError('Error updating business data, could not find business record');
                }
                return business;
            })
            .then((business) => {
                if (args.categoryId) {
                    business.defaultCategoryId = args.categoryId;
                }
                if (args.name) {
                    business.name = args.name;
                }
                if (args.regexps) {
                    business.regexps = args.regexps;
                }
                return business;
            })
            .then((business: Business) => {
                updateItem(business);
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_delete = jest.fn(
    (args: BusinessDeleteArgs): Promise<void> => {
        const { businessId } = args;
        return mock_findBusinessImpl(businessId)
            .then((a) => {
                if (!a) {
                    throw new DatabaseError('Error deleting business, could not find business record');
                }
                return deleteBusiness(businessId);
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_addRule = jest.fn(
    (args: AddRuleArgs): Promise<void> => {
       validateAddRuleArgs(args);
        return mock_findBusinessImpl(args.businessId)
            .then((business) => {
                if (!business) {
                    throw new DatabaseError('Error updating business data, could not find business record');
                }
                return business;
            })
            .then((business) => {
                if (args.rule) {
                    if (business.regexps) {
                        business.regexps.push(args.rule);
                    } else {
                        business.regexps = [args.rule];
                    }
                }
                business.regexps = business.regexps.filter((r) => r != '');
                business.regexps = [...new Set(business.regexps)];
                return business;
            })
            .then((business) => {
                updateItem(business);
            })
            .catch((error) => {
                throw error;
            });
    }
);

export let MockBusinessPersistenceController = jest.fn<BusinessPersistenceController, []>(() => ({
    create: mock_create,
    read: mock_read,
    update: mock_update,
    delete: mock_delete,
    dataController: undefined,
    composeSetStatement: undefined,
    findBusinessImpl: mock_findBusinessImpl,
    addRule: mock_addRule,
}));
