import { CategoryController } from '@controllers/category-controller';
import { CategoryPersistanceController } from '@controllers/data-controller/category/CatgoryPersistanceController';
import { mockableCategoryArgs, MockCategoryPersistanceController } from '@mock/MockCategoryPersistanceController';
import { CreateCategoryArgs } from '@models/category/CreateCategoryArgs';
import { CategoryType } from '@models/category/category';
import { DatabaseError } from '@models/errors/errors';
import { DeleteCategoryArgs } from '@models/category/DeleteCategoryArgs';

const clearCollection = () => {
    mockableCategoryArgs.mockCategoryCollection = [];
};

const getCollection = () => {
    return mockableCategoryArgs.mockCategoryCollection;
};

describe('CategoryController', () => {
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
        const args: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };

        const categoryId = await mockController.create(args);
        expect(categoryId).not.toBeNull();
        expect(categoryId.length).toBeGreaterThan(0);

        const indexOf = getCollection().find((category) => category.userId === args.userId);
        expect(indexOf).not.toBe(undefined);
        expect(getCollection().length).toBeGreaterThan(0);
    });

    it(`should create category with parent categoryId`, async () => {
        clearCollection();
        const args: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };

        const categoryId = await mockController.create(args);
        expect(categoryId).not.toBe(undefined);
        expect(categoryId.length).toBeGreaterThan(0);

        const args2: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id-2',
            parentCategoryId: categoryId,
            categoryType: CategoryType.UserDefined,
        };

        const categoryId2 = await mockController.create(args2);
        expect(categoryId2).not.toBe(undefined);
        expect(categoryId2.length).toBeGreaterThan(0);

        const indexOf = getCollection().findIndex(c => c.categoryId === categoryId2);
        expect(indexOf).not.toBe(undefined);
    });

    it(`should throw on invalid parent category`, async () => {
        clearCollection();
        const args: CreateCategoryArgs = {
            userId: 'test-user-id',
            parentCategoryId: 'invalid-parent-category-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };
        let thrown = false;
        try {
            await mockController.create(args);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('parentCategoryId does not exist'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw on updating by invalid categoryId`, async () => {
        clearCollection();
        const args: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };
        let thrown = false;
        try {
            await mockController.update(args);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('Error updating category, could not find category record'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw on deleting by invalid categoryId`, async () => {
        clearCollection();
        const args: DeleteCategoryArgs = {
            categoryId: 'invalid-category-id',
        };
        let thrown = false;
        try {
            await mockController.delete(args);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('Error deleting category, could not find category record'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should not throw on deleting by valid categoryId`, async () => {
        clearCollection();

        const args: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };

        const categoryId = await mockController.create(args);
        expect(categoryId).not.toBeNull();
        expect(categoryId.length).toBeGreaterThan(0);

        const deleteArgs: DeleteCategoryArgs = {
            categoryId,
        };
        await mockController.delete(deleteArgs);

        const indexOf = getCollection().find((category) => category.userId === args.userId);
        expect(indexOf).toBe(undefined);
        expect(getCollection().length).toEqual(0);
    });

    it(`should throw on updating with invalid parent categoryId`, async () => {
        clearCollection();
        const args: CreateCategoryArgs = {
            userId: 'test-user-id',
            parentCategoryId: 'invalid-parent-category-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };
        let thrown = false;
        try {
            await mockController.update(args);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('parentCategoryId does not exist'));
        }
        expect(thrown).toBeTruthy();
    });

    it(`should throw on duplicate category`, async () => {
        clearCollection();
        const args1: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };

        const args2: CreateCategoryArgs = {
            userId: 'test-user-id',
            caption: 'test-parent-category-id',
            categoryType: CategoryType.UserDefined,
        };
        await mockController.create(args1);
        let thrown = false;
        try {
            await mockController.create(args2);
        } catch (err) {
            thrown = true;
            expect(err).toEqual(new DatabaseError('Category with this name already exists'));
        }
        expect(thrown).toBeTruthy();
    });
});
