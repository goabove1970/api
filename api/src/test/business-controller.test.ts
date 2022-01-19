import { mockableBusinessArgs, MockBusinessPersistenceController } from '@mock/MockBusinessPersistenceControllerBase';
import { BusinessesController } from '@controllers/business-controller';
import { BusinessPersistenceController } from '@controllers/data-controller/business/BusinessPersistenceController';
import { BusinessCreateArgs } from '@models/business/BusinessCreateArgs';
import { DatabaseError, ValidationError } from '@models/errors/errors';
import { BusinessReadArgs } from '@models/business/BusinessReadArgs';
import { BusinessUpdateArgs } from '@models/business/BusinessUpdateArgs';
import { BusinessDeleteArgs } from '@models/business/BusinessDeleteArgs';
import { AddRuleArgs } from '@models/business/AddRuleArgs';

const clearCollection = () => {
    mockableBusinessArgs.businesses = [];
};

const getCollection = () => {
    return mockableBusinessArgs.businesses;
};

describe('BusinessController', () => {
    let mockPersistenceController: BusinessPersistenceController;
    let mockController: BusinessesController;

    beforeEach(() => {
        // 1. Mock BusinessPersistenceController
        MockBusinessPersistenceController.mockClear();
        mockPersistenceController = MockBusinessPersistenceController();
        mockController = new BusinessesController(mockPersistenceController);

        // 2. Init the mock injectible dependencies argument
        clearCollection();
    });

    it(`should create`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        expect(businessId).not.toBeNull();
        expect(businessId.length).toBeGreaterThan(0);

        const indexOf = getCollection().find((b) => b.businessId === businessId);
        expect(indexOf).not.toBe(undefined);
        expect(getCollection().length).toEqual(1);

        const created = getCollection()[0];
        expect(created.defaultCategoryId).toEqual(args.defaultCategoryId);
        expect(created.name).toEqual(args.name);
        expect(created.regexps).toEqual(args.regexps);
    });

    it(`should throw on empty business name`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            regexps: ['some-regex'],
        };
        let thrown = false;
        try {
            await mockController.create(args);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Business name can not be empty'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw on duplicate business name`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            name: 'some-name',
            defaultCategoryId: 'def-cat-id',
            regexps: ['some-regex'],
        };
        await mockController.create(args);

        let thrown = false;
        try {
            await mockController.create(args);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Business with this name already exists'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should not throw on non duplicate business name`, async () => {
        clearCollection();
        const args1: BusinessCreateArgs = {
            name: 'some-name-1',
            defaultCategoryId: 'def-cat-id',
            regexps: ['some-regex'],
        };
        const businessId1 = await mockController.create(args1);

        const args2: BusinessCreateArgs = {
            name: 'some-name-2',
            defaultCategoryId: 'def-cat-id',
            regexps: ['some-regex'],
        };
        let businessId2: string;
        let thrown = false;
        try {
            businessId2 = await mockController.create(args2);
        } catch (err) {
            thrown = true;
        }
        expect(thrown).toBeFalsy();
        expect(getCollection().length).toEqual(2);
        expect(businessId1).not.toEqual(businessId2);
    });

    it(`should read business by business id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        const readArgs: BusinessReadArgs = {
            businessId,
        };
        const businesses = await mockController.read(readArgs);
        expect(businesses.length).toEqual(1);
        const business = businesses[0];
        expect(business.defaultCategoryId).toEqual(args.defaultCategoryId);
        expect(business.name).toEqual(args.name);
        expect(business.regexps).toEqual(args.regexps);
    });

    it(`should read business by category id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        const readArgs: BusinessReadArgs = {
            categoryId: args.defaultCategoryId,
        };
        const businesses = await mockController.read(readArgs);
        expect(businesses.length).toEqual(1);
        const business = businesses[0];
        expect(business.businessId).toEqual(businessId);
        expect(business.defaultCategoryId).toEqual(args.defaultCategoryId);
        expect(business.name).toEqual(args.name);
        expect(business.regexps).toEqual(args.regexps);
    });

    it(`should read business by name`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        const readArgs: BusinessReadArgs = {
            name: args.name,
        };
        const businesses = await mockController.read(readArgs);
        expect(businesses.length).toEqual(1);
        const business = businesses[0];
        expect(business.businessId).toEqual(businessId);
        expect(business.defaultCategoryId).toEqual(args.defaultCategoryId);
        expect(business.name).toEqual(args.name);
        expect(business.regexps).toEqual(args.regexps);
    });

    it(`should throw when updating with empty args`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        await mockController.create(args);
        let thrown = false;
        try {
            await mockController.update(undefined);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Can not update Business, no arguments passed'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw when updating with empty business id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        await mockController.create(args);
        let thrown = false;
        try {
            await mockController.update({});
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Can not update Business, no businessId passed'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw when updating with wrong business id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        await mockController.create(args);
        let thrown = false;
        try {
            await mockController.update({ businessId: 'wrong-business-id' });
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('Error updating business data, could not find business record'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should not throw when updating with empty name`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        let thrown = false;
        try {
            await mockController.update({ businessId });
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Business name can not be empty'));
        }
        expect(thrown).toBeFalsy();
    });

    it(`should update name`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        let thrown = false;
        const updateArgs: BusinessUpdateArgs = {
            businessId,
            name: 'new-name',
        };
        try {
            await mockController.update(updateArgs);
        } catch (err) {
            thrown = true;
        }
        expect(thrown).toBeFalsy();
        const readArgs: BusinessReadArgs = {
            businessId,
        };
        const businesses = await mockController.read(readArgs);
        const business = businesses[0];

        expect(business.defaultCategoryId).toEqual(args.defaultCategoryId);
        expect(business.name).toEqual(updateArgs.name);
        expect(business.regexps).toEqual(args.regexps);
    });

    it(`should update default category id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        let thrown = false;
        const updateArgs: BusinessUpdateArgs = {
            businessId,
            defaultCategoryId: 'new-default-category',
        };
        try {
            await mockController.update(updateArgs);
        } catch (err) {
            thrown = true;
        }
        expect(thrown).toBeFalsy();
        const readArgs: BusinessReadArgs = {
            businessId,
        };
        const businesses = await mockController.read(readArgs);
        const business = businesses[0];

        expect(business.defaultCategoryId).toEqual(updateArgs.defaultCategoryId);
        expect(business.name).toEqual(args.name);
        expect(business.regexps).toEqual(args.regexps);
    });

    it(`should throw when creating rule with empty business id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        await mockController.create(args);
        let thrown = false;
        try {
            const ruleArgs: AddRuleArgs = {};
            await mockController.addRule(ruleArgs);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Can not update Business, no businessId passed'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw when creating rule with wrong business id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        await mockController.create(args);
        let thrown = false;
        try {
            const ruleArgs: AddRuleArgs = {
                businessId: 'wong-business-id',
            };
            await mockController.addRule(ruleArgs);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Error updating business data, could not find business record'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw when creating rule with empty args`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        await mockController.create(args);
        let thrown = false;
        try {
            await mockController.addRule(undefined);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new ValidationError('Can not update Business, no arguments passed'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should create rule`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-rule'],
        };

        const businessId = await mockController.create(args);
        let thrown = false;
        try {
            const ruleArgs: AddRuleArgs = {
                businessId,
                rule: 'new-rule',
            };
            await mockController.addRule(ruleArgs);
        } catch (err) {
            thrown = true;
        }
        expect(thrown).toBeFalsy();

        const readArgs: BusinessReadArgs = {
            businessId,
        };
        const businesses = await mockController.read(readArgs);
        const business = businesses[0];

        expect(business.regexps).toEqual(['some-rule', 'new-rule']);
    });

    it(`should throw when deleting with wrong business id`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        await mockController.create(args);
        let thrown = false;
        try {
            const deleteArgs: BusinessDeleteArgs = {
                businessId: 'wrong-business-id',
            };
            await mockController.delete(deleteArgs);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('Error deleting business, could not find business record'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should delete`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex'],
        };

        const businessId = await mockController.create(args);
        const indexOf = getCollection().findIndex((b) => b.businessId === businessId);
        expect(indexOf).toEqual(0);
        expect(getCollection().length).toEqual(1);

        const deleteArgs: BusinessDeleteArgs = {
            businessId,
        };
        await mockController.delete(deleteArgs);

        const indexOfDeleted = getCollection().findIndex((b) => b.businessId === businessId);
        expect(indexOfDeleted).toEqual(-1);
        expect(getCollection().length).toEqual(0);
    });
});
