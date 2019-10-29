import { FileController } from '@controllers/data-controller/FileController';
import { DataController } from '@controllers/data-controller/DataController';
import { ChaseTransactionParser } from '@controllers/parser-controller/chase/ChaseTransactionParser';
import { ChaseTransaction } from '@models/transaction/chase/ChaseTransaction';

export class ChaseTransactionFileDataController extends FileController<ChaseTransaction> {
  constructor(filename: string) {
    super(filename, new ChaseTransactionParser());
  }
}

export const chaseTransactionFileDataController: DataController<
  ChaseTransaction
> = new ChaseTransactionFileDataController('debit.csv');
