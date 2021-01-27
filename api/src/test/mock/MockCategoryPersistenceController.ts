import { Category, CategoryType } from '@models/category/category';
import { CreateCategoryArgs } from '@models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@models/category/DeleteCategoryArgs';
import { ReadCategoryArgs } from '@models/category/GetCategoryArgs';
import { DeepPartial } from '@models/DeepPartial';
import { DatabaseError } from '@models/errors/errors';
import 'jest';
import { CategoryPersistenceController } from '@controllers/data-controller/category/CatgoryPersistenceController';
import {
    combineNewCategory,
    toShortCategoryDetails,
    validateCategoryUpdateArgs,
    validateCreateCategoryArgs,
    validateDeleteCategoryArgs,
} from '@controllers/data-controller/category/helper';

export const mockableCategoryArgs: { mockCategoryCollection: Category[] } = {
    mockCategoryCollection: [],
};

const matches = (cat: Category, args: ReadCategoryArgs) => {
    if (args.categoryType) {
        if (cat.categoryType !== args.categoryType) {
            return false;
        }
    }

    if (args.categoryId) {
        if (cat.categoryId !== args.categoryId) {
            return false;
        }
    }

    if (args.userId) {
        if (cat.userId && cat.userId !== args.userId) {
            return false;
        }
    }

    if (args.parentCategoryId) {
        if (cat.parentCategoryId !== args.parentCategoryId) {
            return false;
        }
    }

    return true;
};

const updateCategory = (category: Category) => {
    const index = mockableCategoryArgs.mockCategoryCollection.findIndex((e) => e.categoryId === category.categoryId);
    if (index !== -1) {
        mockableCategoryArgs.mockCategoryCollection[index] = category;
    }
};

const deleteCategory = (categoryId: string) => {
    const index = mockableCategoryArgs.mockCategoryCollection.findIndex((e) => e.categoryId === categoryId);
    if (index > -1) {
        mockableCategoryArgs.mockCategoryCollection.splice(index, 1);
    }
};

const mock_read = jest.fn(
    (args: ReadCategoryArgs): Promise<DeepPartial<Category>[]> => {
        const filtered = mockableCategoryArgs.mockCategoryCollection.filter((cat) => matches(cat, args));
        const mapped = filtered.map(toShortCategoryDetails);
        return Promise.resolve(mapped);
    }
);

const mock_findCategoryImpl = jest.fn(
    (categoryId: string): Promise<Category | undefined> => {
        const filtered = mockableCategoryArgs.mockCategoryCollection.filter((c) => c.categoryId === categoryId);
        return Promise.resolve(filtered && filtered.length > 0 ? filtered[0] : undefined);
    }
);

const mock_create = jest.fn(
    async (args: CreateCategoryArgs): Promise<string> => {
        const n: Category = combineNewCategory(args);
        validateCreateCategoryArgs(args);
        await mock_checkDuplicateName(args.caption, args.userId);
        const catgory = await mock_findCategoryImpl(args.parentCategoryId);
        if (args.parentCategoryId && !catgory) {
            throw new DatabaseError('parentCategoryId does not exist');
        }
        mockableCategoryArgs.mockCategoryCollection.push(n);
        return Promise.resolve(n.categoryId);
    }
);

const mock_update = jest.fn(
    (args: CreateCategoryArgs): Promise<void> => {
        validateCategoryUpdateArgs(args);
        return mock_checkDuplicateName(args.caption, args.userId)
            .then(() => mock_findCategoryImpl(args.parentCategoryId))
            .then((category) => {
                if (args.parentCategoryId && !category) {
                    throw new DatabaseError('parentCategoryId does not exist');
                }
            })
            .then(() => mock_findCategoryImpl(args.categoryId))
            .then((c) => {
                if (!c) {
                    throw new DatabaseError('Error updating category, could not find category record');
                }
                return c;
            })
            .then((c) => {
                if (args.parentCategoryId) {
                    c.parentCategoryId = args.parentCategoryId;
                }

                if (args.caption) {
                    c.caption = args.caption;
                }
                return c;
            })
            .then((c) => {
                updateCategory(c);
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_delete = jest.fn(
    (args: DeleteCategoryArgs): Promise<void> => {
        validateDeleteCategoryArgs(args);
        return mock_findCategoryImpl(args.categoryId)
            .then((category) => {
                if (!category) {
                    throw new DatabaseError('Error deleting category, could not find category record');
                }
                if (category.categoryType === CategoryType.Default && args.userId) {
                    throw new DatabaseError(
                        'User can not delete default categories, only custom user ctegories can be deleted by user'
                    );
                }
            })
            .then(() => {
                deleteCategory(args.categoryId);
            })
            .catch((error) => {
                throw error;
            });
    }
);

const mock_checkDuplicateName = jest.fn(
    (categoryName: string, userId?: string): Promise<void> => {
        let filtered = mockableCategoryArgs.mockCategoryCollection.filter((c) => c.caption === categoryName);
        if (userId) {
            filtered = filtered.filter((c) => c.userId == userId);
        }

        if (filtered && filtered.length > 0) {
            throw new DatabaseError('Category with this name already exists');
        }

        return Promise.resolve();
    }
);



export let MockCategoryPersistenceController = jest.fn<CategoryPersistenceController, []>(() => ({
    create: mock_create,
    read: mock_read,
    update: mock_update,
    delete: mock_delete,
    dataController: undefined,
    checkDuplicateName: mock_checkDuplicateName,
    findCategoryImpl: mock_findCategoryImpl,
}));
