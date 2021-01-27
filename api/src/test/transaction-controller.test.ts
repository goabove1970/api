import { mockableTransactionArgs, MockTransactionPersistenceController } from '@mock/MockTransactionsPersistenceController';
// import { TransacitonPersistenceController } from '../controllers/data-controller/transaction/TransacitonPersistenceController';
// import { TransactionController } from '../controllers/transaction-controller/TransactionController';

const clearCollection = () => {
    mockableTransactionArgs.mockTransactionCollection = [];
};

// const getCollection = () => {
//     return mockableTransactionArgs.mockTransactionCollection;
// };

describe('TransactionController', () => {
    // let mockPersistenceController: TransacitonPersistenceController;
    // let mockController: TransactionController;

    beforeEach(() => {
        // 1. Mock TransactionPersistenceController
        MockTransactionPersistenceController.mockClear();
        // mockPersistenceController = MockTransactionPersistenceController();
        // mockController = new TransactionController(mockPersistenceController);

        // 2. Init the mock injectible dependencies argument
        clearCollection();
    });

    it(`should create transaction`, async () => {

    });
});
