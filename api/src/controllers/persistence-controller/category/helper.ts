import { GuidFull } from '@utils/generateGuid';
import { DeepPartial } from '@models/DeepPartial';
import { Category, CategoryType } from '@src/models/category/category';
import { ReadCategoryArgs } from '@src/models/category/GetCategoryArgs';
import { CreateCategoryArgs } from '@src/models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@src/models/category/DeleteCategoryArgs';

export function validateCreateCategoryArgs(args: CreateCategoryArgs): void {
    if (!args.caption) {
        throw {
            message: 'Category name can not be empty',
        };
    }
}

export function validateDeleteCategoryArgs(args: DeleteCategoryArgs): void {
    if (!args) {
        throw {
            message: 'Can not delete category, arguments are missing',
        };
    }
}

export const toShortCategoryDetails = (category: Category): DeepPartial<Category> => {
    const details: DeepPartial<Category> = {
        userId: category.userId,
        categoryId: category.categoryId,
        caption: category.caption,
        categoryType: category.categoryType,
    };
    if (category.parentCategoryId) {
        details.parentCategoryId = category.parentCategoryId;
    }
    return details;
};

export const combineNewCategory = (args: CreateCategoryArgs): Category => {
    return {
        userId: args.userId,
        categoryId: GuidFull(),
        parentCategoryId: args.parentCategoryId,
        caption: args.caption,
        categoryType: args.userId ? CategoryType.UserDefined : CategoryType.Default,
    };
};

export function matchesReadArgs(m: Category, args: ReadCategoryArgs): boolean {
    if (!args) {
        return true;
    }

    let matches = true;
    if (args.categoryType && m.categoryType) {
        matches = matches && m.categoryType === args.categoryType;
    }

    if (args.categoryId && m.categoryId) {
        matches = matches && m.categoryId === args.categoryId;
    }

    if (args.userId && m.userId) {
        matches = matches && m.userId === args.userId;
    }

    if (args.parentCategoryId && m.parentCategoryId) {
        matches = matches && m.parentCategoryId === args.parentCategoryId;
    }

    return matches;
}

export function validateCategoryUpdateArgs(args: CreateCategoryArgs): void {
    if (!args) {
        throw {
            message: 'Can not update category, no arguments passed',
        };
    }

    if (!args.categoryId) {
        throw {
            message: 'Can not update category, no categoryId passed',
        };
    }

    if (args.categoryId === args.parentCategoryId) {
        throw {
            message: 'Category can not nest itself',
        };
    }

    validateCreateCategoryArgs(args);
}
