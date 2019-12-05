import { DeepPartial } from '@models/DeepPartial';
import { GuidFull } from '@utils/generateGuid';
import { DatabaseError } from '@root/src/models/errors/errors';
import { BusinessReadArgs } from '@root/src/models/business/BusinessReadArgs';
import { Business } from '@root/src/models/business/business';
import { BusinessCreateArgs } from '@root/src/models/business/BusinessCreateArgs';
import { BusinessUpdateArgs } from '@root/src/models/business/BusinessUpdateArgs';
import { businessPersistanceController } from './BusinessPersistanceController';

export const toShortBusinessDetails = (business: Business): DeepPartial<Business> | undefined => {
    return {
        businessId: business.businessId,
        name: business.name,
        defaultCategoryId: business.defaultCategoryId,
    };
};

export function matchesReadArgs(args: BusinessReadArgs): string {
    let query = ' AS ac ';

    if (!args) {
        return query;
    }

    const conditions = [];

    if (args.businessId) {
        conditions.push(`ac.business_id=${!args.businessId ? 'NULL' : "'" + args.businessId + "'"}`);
    }

    if (args.name) {
        conditions.push(`ac.name=${!args.name ? 'NULL' : "'" + args.name + "'"}`);
    }

    const where = 'WHERE';
    const finalSattement = query + (conditions.length > 0 ? `${where} ${conditions.join(' AND ')}` : '');
    return finalSattement;
}

export function validateCreateBusinessArgs(args: BusinessCreateArgs): Promise<void> {
    if (!args.businessId) {
        throw new DatabaseError('Business id can not be empty');
    }

    if (!args.name) {
        throw new DatabaseError('Business name can not be empty');
    }

    return businessPersistanceController
        .read({ businessId: args.businessId })
        .then((business) => {
            if (!business) {
                throw {
                    message: 'Business with provided id was not found',
                };
            }
        })
        .then(() => {
            if (!args.name) {
                throw {
                    message: 'Name can not be empty',
                };
            }
        })
        .catch((error) => {
            throw error;
        });
}

export const combineNewBusiness = (args: BusinessCreateArgs): Business => {
    return {
        businessId: GuidFull(),
        name: args.name,
        defaultCategoryId: args.defaultCategoryId,
        regexps: [],
    };
};

export function validateBusinessUpdateArgs(args: BusinessUpdateArgs): Promise<void> {
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

    return validateCreateBusinessArgs(args);
}
