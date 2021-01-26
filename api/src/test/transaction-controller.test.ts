import { mockableTransactionArgs, MockTransactionPersistanceController } from './mock/MockTransactionsPersistenceController';
// import { TransacitonPersistenceController } from '../controllers/data-controller/transaction/TransacitonPersistenceController';
// import { TransactionController } from '../controllers/transaction-controller/TransactionController';

const clearCollection = () => {
    mockableTransactionArgs.mockTransactionCollection = [];
};

// const getCollection = () => {
//     return mockableTransactionArgs.mockTransactionCollection;
// };

describe('TransactionController', () => {
    // let mockPersistanceController: TransacitonPersistenceController;
    // let mockController: TransactionController;

    beforeEach(() => {
        // 1. Mock TransactionPersistanceController
        MockTransactionPersistanceController.mockClear();
        // mockPersistanceController = MockTransactionPersistanceController();
        // mockController = new TransactionController(mockPersistanceController);

        // 2. Init the mock injectible dependencies argument
        clearCollection();
    });

    it(`should create transaction`, async () => {

    });
});
