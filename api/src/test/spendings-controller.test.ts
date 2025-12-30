import { SpendingsController } from '@controllers/spendings-controller/spendings-controller';
import { AccountController } from '@controllers/account-controller/account-controller';
import { CategoryController } from '@controllers/category-controller';
import { MockAccountPersistenceController } from '@mock/MockAccountPersistenceController';
import { MockCategoryPersistenceController } from '@mock/MockCategoryPersistenceController';
import { AccountPersistenceController } from '@controllers/data-controller/account/account-persistance-controller/account-persistance-controller';
import { CategoryPersistenceController } from '@controllers/data-controller/category/CatgoryPersistenceController';
import { SpendingRequestArgs } from '@routes/request-types/SpendingsRequest';
import { AccountType } from '@models/accounts/Account';
import moment = require('moment');

describe('SpendingsController', () => {
    let spendingsController: SpendingsController;
    let mockAccountController: AccountController;
    let mockCategoryController: CategoryController;
    let mockAccountPersistenceController: AccountPersistenceController;
    let mockCategoryPersistenceController: CategoryPersistenceController;

    beforeEach(() => {
        mockAccountPersistenceController = MockAccountPersistenceController();
        mockCategoryPersistenceController = MockCategoryPersistenceController();
        mockAccountController = new AccountController(mockAccountPersistenceController);
        mockCategoryController = new CategoryController(mockCategoryPersistenceController);
        spendingsController = new SpendingsController(mockAccountController, mockCategoryController);
    });

    it('should build spending progression with empty transactions', () => {
        const transactions = [];
        const accountsMap = {};
        const result = spendingsController.buildSpendingProgression(transactions, accountsMap);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
    });

    it('should build spendings by month with empty transactions', () => {
        const transactions = [];
        const categoriesMap = {};
        const accountsMap = {};
        const result = spendingsController.buildSpendingsByMonth(transactions, categoriesMap, accountsMap);
        expect(result).toBeDefined();
        expect(result.parents).toBeDefined();
        expect(result.subs).toBeDefined();
        expect(Array.isArray(result.parents)).toBe(true);
        expect(Array.isArray(result.subs)).toBe(true);
    });

    it('should process read spending request with valid args', async () => {
        const mockArgs: SpendingRequestArgs = {
            userId: 'test-user-id',
            startDate: moment().subtract(1, 'month').toDate(),
            endDate: moment().toDate(),
            includeSubcategories: false,
        };

        // Mock account controller
        jest.spyOn(mockAccountController, 'getMap').mockResolvedValue({
            'account-1': {
                accountId: 'account-1',
                accountType: AccountType.Checking,
            },
        });

        // Mock category controller
        jest.spyOn(mockCategoryController, 'read').mockResolvedValue([
            {
                categoryId: 'cat-1',
                caption: 'Test Category',
            },
        ]);

        // Mock transaction controller - need to import and mock it
        const { transactionController } = require('@controllers/transaction-controller/TransactionController');
        jest.spyOn(transactionController, 'read').mockResolvedValue([]);
        
        const result = await spendingsController.processReadSpendingRequest(mockArgs);
        expect(result).toBeDefined();
        expect(result.action).toBe('read');
        expect(result.startDate).toEqual(mockArgs.startDate);
        expect(result.endDate).toEqual(mockArgs.endDate);
    });

    it('should build monthly balances', async () => {
        const accountsMap = {
            'account-1': {
                accountId: 'account-1',
                accountType: AccountType.Checking,
            },
        };
        const accountIds = ['account-1'];

        // Mock transaction controller
        const { transactionController } = require('@controllers/transaction-controller/TransactionController');
        jest.spyOn(transactionController, 'read').mockResolvedValue([]);

        const result = await spendingsController.buildMonthlyBalances(accountsMap, accountIds);
        expect(Array.isArray(result)).toBe(true);
    });
});

