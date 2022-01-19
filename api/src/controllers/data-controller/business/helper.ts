import { DeepPartial } from '@models/DeepPartial';
import { GuidFull } from '@utils/generateGuid';
import { ValidationError } from '@models/errors/errors';
import { BusinessReadArgs } from '@models/business/BusinessReadArgs';
import { Business } from '@models/business/Business';
import { BusinessCreateArgs } from '@models/business/BusinessCreateArgs';
import { BusinessUpdateArgs } from '@models/business/BusinessUpdateArgs';
import { businessPersistenceController } from './BusinessPersistenceController';
import { AddRuleArgs } from '@models/business/AddRuleArgs';

export const toShortBusinessDetails = (business: Business): DeepPartial<Business> | undefined => {
    return {
        businessId: business.businessId,
        name: business.name,
        defaultCategoryId: business.defaultCategoryId,
        regexps: business.regexps,
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

    if (args.categoryId) {
        conditions.push(`ac.default_category_id=${!args.categoryId ? 'NULL' : "'" + args.categoryId + "'"}`);
    }

    const where = 'WHERE';
    const finalSattement = query + (conditions.length > 0 ? `${where} ${conditions.join(' AND ')}` : '');
    return finalSattement;
}

export function validateCreateBusinessArgs(args: BusinessCreateArgs): Promise<void> {
    if (!args.name) {
        throw new ValidationError('Business name can not be empty');
    }

    return businessPersistenceController
        .read({ name: escape(args.name) })
        .then((business) => {
            if (business && business.length > 0) {
                throw new ValidationError('Business with this name already exists');
            }
        })
        .catch((error) => {
            throw error;
        });
}

export const combineNewBusiness = (args: BusinessCreateArgs): Business => {
    const newBusiness: Business = {
        businessId: GuidFull(),
        name: args.name,
        defaultCategoryId: args.defaultCategoryId,
        regexps: [],
    };

    if (args.regexps && args.regexps.length > 0) {
        newBusiness.regexps = args.regexps;
    }
    
    return newBusiness;
};

export function validateBusinessUpdateArgs(args: BusinessUpdateArgs): Promise<void> {
    if (!args) {
        throw new ValidationError('Can not update Business, no arguments passed');
    }

    if (!args.businessId) {
        throw new ValidationError('Can not update Business, no businessId passed');
    }

    return Promise.resolve();
}

export function validateAddRuleArgs(args: AddRuleArgs): void {
    if (!args) {
        throw new ValidationError('Can not update Business, no arguments passed');
    }

    if (!args.businessId) {
        throw new ValidationError('Can not update Business, no businessId passed');
    }
}
