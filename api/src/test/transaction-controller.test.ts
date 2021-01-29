import {
    mockableTransactionArgs,
    MockTransactionPersistenceController,
} from '@mock/MockTransactionsPersistenceController';
import { BusinessesController } from '../controllers/business-controller';
import { BusinessPersistenceController } from '../controllers/data-controller/business/BusinessPersistenceController';
import { TransacitonPersistenceController } from '../controllers/data-controller/transaction/TransacitonPersistenceController';
import { TransactionController } from '../controllers/transaction-controller/TransactionController';
import { TransactionImportResult } from '../controllers/transaction-controller/TransactionImportResult';
import { ChaseTransactionOriginType } from '../models/transaction/chase/ChaseTransactionOriginType';
import { CreditCardTransactionType, ChaseTransactionType } from '../models/transaction/chase/ChaseTransactionType';
import { Transaction } from '../models/transaction/transaction';
import { SortOrder, TransactionReadArg } from '../models/transaction/TransactionReadArgs';
import { MockBusinessPersistenceController } from './mock/MockBusinessPersistenceControllerBase';

const clearCollection = () => {
    mockableTransactionArgs.mockTransactionCollection = [];
};

const getCollection = () => {
    return mockableTransactionArgs.mockTransactionCollection;
};

const getMatchingTransactions: (args: TransactionReadArg) => Promise<Transaction[]> = (args: TransactionReadArg) => {
    if (!args) {
        const res: Transaction[] = [];
        return Promise.resolve(res);
    }

    const initFilteredCollection = () => {
        const resolvedPromise: Transaction[] = [];
        return Promise.resolve(resolvedPromise);
    };

    return initFilteredCollection().then((tr: Transaction[]) => {
        const someTr = tr.filter((t) => true);
        return someTr;
    });
};

const mock_test_promise = jest.fn(
    (args: TransactionReadArg): Promise<Transaction[]> => {
        const res = getMatchingTransactions(args);
        return Promise.resolve(res);
    }
);

describe('TransactionController', () => {
    let mockPersistenceController: TransacitonPersistenceController;
    let mockController: TransactionController;
    let mockBusinessPersistenceController: BusinessPersistenceController;
    let mockBusinessController: BusinessesController;

    beforeEach(() => {
        // 0. Mock Business Controller
        MockBusinessPersistenceController.mockClear();
        mockBusinessPersistenceController = MockBusinessPersistenceController();
        mockBusinessController = new BusinessesController(mockBusinessPersistenceController);

        // 1. Mock TransactionPersistenceController
        MockTransactionPersistenceController.mockClear();
        mockPersistenceController = MockTransactionPersistenceController();
        mockController = new TransactionController(mockPersistenceController, mockBusinessController);

        // 2. Init the mock injectible dependencies argument
        clearCollection();
    });

    it('example of test with promise', async () => {
        const readArgs = {};
        // const readData = await mockController.read(readArgs);
        const readData = await mock_test_promise(readArgs);
        expect((readData as Transaction[]).length).toEqual(0);
    });

    it(`should create transactions`, async () => {
        clearCollection();

        const accountId = 'some-account-id';
        const transactionArgs: Transaction = {
            accountId,
            businessId: 'some-business-id',
            categoryId: 'some-category',
            chaseTransaction: {
                Description: 'some-description',
                Details: ChaseTransactionOriginType.Credit,
                PostingDate: new Date(2021, 1, 14),
                Amount: 123,
                Balance: 456,
                BankDefinedCategory: 'some-bank-defined-category',
                CheckOrSlip: 'check-no',
                CreditCardTransactionType: CreditCardTransactionType.Sale,
                Type: ChaseTransactionType.AchCredit,
            },
            userComment: 'comment',
        };

        const importData: TransactionImportResult = await mockController.addTransaction(transactionArgs, accountId);
        expect(importData).toEqual({
            businessRecognized: 0,
            duplicates: 0,
            multipleBusinessesMatched: 0,
            newTransactions: 1,
            parsed: 1,
            unposted: 0,
            unrecognized: 1,
        });
        expect(getCollection().length).toEqual(1);
    });

    it(`should read transactions`, async () => {
        clearCollection();
        const comparisonDepth = 30;
        const readArgs = {
            accountId: 'some-account-id',
            order: SortOrder.descending,
            readCount: comparisonDepth,
        };
        const readData = await mockController.read(readArgs);
        expect((readData as Transaction[]).length).toEqual(0);
    });
});
