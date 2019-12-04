import { FileController } from '@controllers/data-controller/FileController';
import { CachedDataController } from '@src/controllers/data-controller/CachedDataController';
import { ChaseTransactionParser } from '@controllers/parser-controller/chase/ChaseTransactionParser';
import { ChaseTransaction } from '@models/transaction/chase/ChaseTransaction';

export const chaseTransactionParser: ChaseTransactionParser = new ChaseTransactionParser();

export class ChaseTransactionFileDataController extends FileController<ChaseTransaction> {
    constructor(filename: string) {
        super(filename, chaseTransactionParser);
    }
}

export const chaseTransactionFileDataController: CachedDataController<
    ChaseTransaction
> = new ChaseTransactionFileDataController('debit.csv');
