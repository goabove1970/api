import { ChaseTransaction } from "@models/transaction/chase/ChaseTransaction";
import { FileController } from "@src/controllers/data-controller/FileController";
import { DataController } from "@src/controllers/data-controller/DataController";
import { ChaseTransactionParser } from "@src/controllers/parser-controller/chase/ChaseTransactionParser";

export class ChaseTransactionFileDataController extends FileController<ChaseTransaction> {
  constructor(filename: string) {
    super(filename, new ChaseTransactionParser());
  }
}

export const chaseTransactionFileDataController: DataController<
  ChaseTransaction
> = new ChaseTransactionFileDataController("/Users/ievgenmelnychuk/Desktop/First/src/controllers/helper/debit.csv");
