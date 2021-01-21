import { CategoryController } from '.';
import { CategoryPersistanceController } from '@controllers/data-controller/category/CatgoryPersistanceController';
import { mockableCategoryArgs, MockCategoryPersistanceController } from './MockCategoryPersistanceController';
import { CreateCategoryArgs } from '@models/category/CreateCategoryArgs';
import { CategoryType } from '@models/category/category';
import { DatabaseError } from '@models/errors/errors';

const clearCollection = () => {
    mockableCategoryArgs.mockCategoryCollection = [];
};

const getCollection = () => {
    return mockableCategoryArgs.mockCategoryCollection;
};

describe('MockCategoryController', () => {
    let mockPersistanceController: CategoryPersistanceController;
    let mockController: CategoryController;

    beforeEach(() => {
        // 1. Mock CategoryPersistanceController
        MockCategoryPersistanceController.mockClear();
        mockPersistanceController = MockCategoryPersistanceController();
        mockController = new CategoryController(mockPersistanceController);

        // 2. Init the mock injectible dependencies argument
        mockableCategoryArgs.mockCategoryCollection = [];
    });

    it(`should create category`, async () => {
        clearCollection();
        const createUserArgs: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };

        const categoryId = await mockController.create(createUserArgs);
        expect(categoryId).not.toBeNull();
        expect(categoryId.length).toBeGreaterThan(0);

        const indexOf = getCollection().find((category) => category.userId === createUserArgs.userId);
        expect(indexOf).not.toEqual(-1);
        expect(getCollection().length).toBeGreaterThan(0);
    });

    it(`should throw on invalid parent category`, async () => {
        clearCollection();
        const createUserArgs: CreateCategoryArgs = {
            userId: 'test-user-id',
            parentCategoryId: 'invalid-parent-category-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };
        let thrown = false;
        try {
            await mockController.create(createUserArgs);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('parentCategoryId does not exist'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw on duplicate category`, async () => {
        clearCollection();
        const createUserArgs1: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };

        const createUserArgs2: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };
        await mockController.create(createUserArgs1);
        let thrown = false;
        try {
            await mockController.create(createUserArgs2);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('Category with this name already exists'));
        }
        expect(thrown).toBeTruthy();
    });
});
