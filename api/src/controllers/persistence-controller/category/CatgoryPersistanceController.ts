import { CategoryPersistanceControllerBase } from './CategoryPersistanceControllerBase';
import { DataController } from '@controllers/data-controller/DataController';
import { DeepPartial } from '@models/DeepPartial';
import {
    validateCreateCategoryArgs,
    combineNewCategory,
    validateCategoryUpdateArgs,
    validateDeleteCategoryArgs,
    toShortCategoryDetails,
    matchesReadArgs,
} from './helper';
import { Category, CategoryType } from '@src/models/category/category';
import { CreateCategoryArgs } from '@src/models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@src/models/category/DeleteCategoryArgs';
import { categoryFileDataController } from '@src/controllers/data-controller/category/CategoryFileDataController';
import { ReadCategoryArgs } from '@src/models/category/GetCategoryArgs';

export class CategoryPersistanceController implements CategoryPersistanceControllerBase {
    delete(args: DeleteCategoryArgs) {
        this.checkCache('deleting category');
        validateDeleteCategoryArgs(args);
        const category = this.findCategoryImpl(args.categoryId);
        if (!category) {
            throw {
                message: 'Error deleting category, could not find category record',
            };
        }
        if (category.categoryType === CategoryType.Default && args.userId) {
            throw {
                message: 'User can not delete default categories, only custom user ctegories can be deleted by user',
            };
        }
        if (args.categoryId) {
            this.dataController.cache = this.dataController.cache.filter((u) => u.categoryId !== args.categoryId);
        }
        if (args.parentCategoryId) {
            this.dataController.cache = this.dataController.cache.filter(
                (u) => u.parentCategoryId !== args.parentCategoryId
            );
        }
        if (args.userId) {
            this.dataController.cache = this.dataController.cache.filter((u) => u.userId !== args.userId);
        }
        this.dataController.commitAllRecords();
    }
    create(args: CreateCategoryArgs): string {
        this.checkCache('creating category');
        this.checkDuplicateName(args.caption, args.userId);
        validateCreateCategoryArgs(args);
        const newCategory = combineNewCategory(args);
        this.dataController.cache.push(newCategory);
        this.dataController.commitAllRecords();
        return newCategory.categoryId;
    }
    update(args: CreateCategoryArgs) {
        this.checkCache('updating category');
        this.checkDuplicateName(args.caption, args.userId);
        validateCategoryUpdateArgs(args);
        const category = this.findCategoryImpl(args.categoryId);
        if (!category) {
            throw {
                message: 'Error updating category, could not find category record',
            };
        }

        if (args.parentCategoryId) {
            category.parentCategoryId = args.parentCategoryId;
        }

        if (args.caption) {
            category.caption = args.caption;
        }

        this.dataController.commitAllRecords();
    }
    read(args: ReadCategoryArgs): DeepPartial<Category>[] {
        this.checkCache('getting categories');
        return this.dataController.cache.filter((u) => matchesReadArgs(u, args)).map((u) => toShortCategoryDetails(u));
    }
    private dataController: DataController<Category>;

    constructor(controller: DataController<Category>) {
        this.dataController = controller;
    }

    private checkCache(action?: string) {
        if (!this.dataController || !this.dataController.cache) {
            throw {
                message: action ? `Error while ${action}, ` : '' + ' category cache not initialized',
            };
        }
    }

    checkDuplicateName(categoryName: string, userId?: string): void {
        const duplicate =
            categoryName &&
            categoryName.length > 0 &&
            !this.dataController.cache.some((u) => u.caption === categoryName && u.userId === userId);
        if (duplicate) {
            throw {
                message: 'Category with this name already exists',
            };
        }
    }

    private findCategoryImpl(categoryId: string): Category | undefined {
        this.checkCache('reading category by id');
        return this.dataController.cache.find((u) => u.categoryId === categoryId);
    }
}

export const categoryPersistanceController = new CategoryPersistanceController(categoryFileDataController);
