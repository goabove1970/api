import { logHelper} from "@root/src/logger";
import { AccountType, UserAccount } from "@root/src/models/accounts/Account";
import { Category } from "@root/src/models/category/category";
import { DeepPartial } from "@root/src/models/DeepPartial";
import { BaseSpending } from "@root/src/models/spendings/BaseSpending";
import { CategorySpending } from "@root/src/models/spendings/CategorySpending";
import { Transaction } from "@root/src/models/transaction/transaction";
import { isCreditAccountType, isDebitAccountType } from "@root/src/utils/accountUtils";
import { CategorizationResult } from "./categorization-result";

export const updateTotal = (spending: BaseSpending, accountType: AccountType, amount: number):
void => {
if (isDebitAccountType(accountType)) {
    // negative number is debit, positive is credit
    if (amount > 0) {
        spending.credit += Math.abs(amount);
    } else {
        spending.debit += Math.abs(amount);
    }
} else if (isCreditAccountType(accountType)) {
    // negative number is debit, positive is credit
    if (amount > 0) {
        spending.credit += Math.abs(amount);
    } else {
        spending.debit += Math.abs(amount);
    }
}
};

export const newSpendingCat = (category: Category): CategorySpending => {
    return {
        name: category.caption,
        categoryId: category.categoryId,
        parentCategoryId: category.parentCategoryId,
        debit: 0,
        credit: 0,
        saldo: 0,
    };
}

export const getRootCategoryId = (forCategory: string, allCategories: {}): string | undefined => {
    if (!forCategory) {
        return undefined;
    }
    if (!allCategories) {
        return undefined;
    }

    if (!allCategories[forCategory]) {
        return undefined;
    }

    const parent = allCategories[forCategory];
    if (!parent.parentCategoryId) {
        return forCategory;
    }

    return getRootCategoryId(parent.parentCategoryId, allCategories);
};

export const getRootCategory = (allCategories: {}, forCategory?: Category): Category | undefined => {
    if (forCategory.parentCategoryId === undefined) {
        return forCategory;
    }

    if (allCategories[forCategory.parentCategoryId]) {
        return getRootCategory(allCategories, allCategories[forCategory.parentCategoryId]);
    } else {
        return undefined; // broken chain of categories
    }
};

export const categorize = (transactions: Transaction[],
    accountsMap: {},
    categoriesMap: {},
    includeSubcategories: boolean): CategorizationResult => {

    let res: CategorizationResult = {
        parents: {},
    };

    if (includeSubcategories) {
        res.subs = {};
    }

    // const parentCategories = new Map<string, CategorySpending>();

    const uncategorized: CategorySpending = {
        name: 'Uncategorized',
        debit: 0,
        credit: 0,
        saldo: 0,
    };
    // const subCatgories = new Map<string, CategorySpending>();

    transactions.forEach((t: Transaction) => {
        const account = accountsMap[t.accountId];
        if (!account) {
            const errorMessage = `Can't find account ${t.accountId} while processing transaction ${t.transactionId}`;
            logHelper.error(errorMessage);
            throw errorMessage;
        }

        // handles undefined / unknown categories
        if (!categoriesMap[t.categoryId]) {
            addTransaction(uncategorized, t, account, res.parents, categoriesMap, res.subs);
            return;
        }

        // add/retrieve a spending category from parents/subcategories
        const catDetails = categoriesMap[t.categoryId];
        let spendingCat: CategorySpending;
        // let rootCat: CategorySpending = undefined;
        if (catDetails.parentCategoryId) {
            // this transaction belongs to a subcategory
            if (includeSubcategories) {
                if (res.subs && res.subs[t.categoryId]) {
                    spendingCat = res.subs[t.categoryId];
                } else {
                    spendingCat = newSpendingCat(catDetails);
                    if (res.subs) {
                        res.subs[t.categoryId] = spendingCat;
                    }
                }
            }

            //get the most parent category for current subcategory
            const root = getRootCategory(categoriesMap, catDetails);
            let rootCat: CategorySpending;
            if (root !== undefined) {
                if (!res.parents[root.categoryId]) {
                    rootCat = newSpendingCat(root);
                    res.parents[rootCat.categoryId] = rootCat;
                }
            }
        } else {
            // this transaction belongs to a parent category
            if (res.parents[t.categoryId]) {
                spendingCat = res.parents[t.categoryId];
            } else {
                spendingCat = newSpendingCat(catDetails);
                res.parents[t.categoryId] = spendingCat;
            }
        }
        addTransaction(spendingCat, t, account, res.parents, categoriesMap, res.subs);
    });

    return res;
}

export const addTransaction = (
    cat: CategorySpending,
    t: Transaction,
    acc: DeepPartial<UserAccount>,
    parentCategories: {},
    categoryMap: {},
    subcategories?: {}
): void => {
    // now update parent categories for this category
    let categoryIdIterator = cat.categoryId;
    let categoryToUpdate: CategorySpending;
    while (categoryIdIterator !== undefined) {
        // will begoing up until we end up finding the parent category
        if (subcategories && subcategories[categoryIdIterator]) {
            // this is a subcategory
            categoryToUpdate = subcategories[categoryIdIterator];
        } else if (parentCategories[categoryIdIterator]) {
            // this is a prent category
            categoryToUpdate = parentCategories[categoryIdIterator];

        } else if (categoryMap[categoryIdIterator]) {
            // might be one of the following:
            // 1. subcategory but they are not requsted to passed empty to this function
            // 2. one or more nodes in the category tree are missing (deleted)

            const cat = categoryMap[categoryIdIterator];
            categoryIdIterator = cat.parentCategoryId;
            // skipping the iterator increment
            continue;
        } else {
            // unknown category id
            break;
        }
        updateTotal(categoryToUpdate, acc.accountType, t.chaseTransaction.Amount);
        categoryToUpdate.saldo = categoryToUpdate.credit - categoryToUpdate.debit;
        if (!categoryToUpdate.parentCategoryId ||
            categoryToUpdate.parentCategoryId === null ||
            categoryToUpdate.parentCategoryId === '' ||
            !parentCategories[categoryToUpdate.parentCategoryId])
            // exiting if updated the most parent category for this transaction
            break;
        categoryIdIterator = categoryToUpdate.parentCategoryId;
    }
};