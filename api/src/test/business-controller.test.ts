import { mockableBusinessArgs, MockBusinessPersistenceController } from '@mock/MockBusinessPersistenceControllerBase';
import { BusinessesController } from '@controllers/business-controller';
import { BusinessPersistenceController } from '@controllers/data-controller/business/BusinessPersistenceController';
import { BusinessCreateArgs } from '@models/business/BusinessCreateArgs';

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

    it(`should create business`, async () => {
        clearCollection();
        const args: BusinessCreateArgs = {
            defaultCategoryId: 'def-cat-id',
            name: 'business-name',
            regexps: ['some-regex']
        };

        const businessId = await mockController.create(args);
        expect(businessId).not.toBeNull();
        expect(businessId.length).toBeGreaterThan(0);

        const indexOf = getCollection().find((b) => b.businessId === businessId);
        expect(indexOf).not.toBe(undefined);
        expect(getCollection().length).toBeGreaterThan(0);
    });
});
