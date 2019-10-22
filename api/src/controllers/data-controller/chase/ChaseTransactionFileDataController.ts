import { ChaseTransaction } from '../../../models/transaction/chase/ChaseTransaction';
import { FileController } from '../FileController';
import { DataController } from '../DataController';
import { ChaseTransactionParser } from '../../../controllers/parser-controller/chase/ChaseTransactionParser';

export class ChaseTransactionFileDataController extends FileController<ChaseTransaction> {
    constructor(filename: string) {
        super(filename, new ChaseTransactionParser());
    }
}

export const chaseTransactionFileDataController: DataController<ChaseTransaction> =
    new ChaseTransactionFileDataController('/Users/ievgenmelnychuk/Desktop/First/src/controllers/helper/debit.csv');
