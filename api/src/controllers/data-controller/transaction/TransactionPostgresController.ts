import { DatabaseController } from '../DataController';
import { Value } from 'ts-postgres';
import { Transaction } from '@models/transaction/transaction';

export class TransactionPostgresController extends DatabaseController<Transaction> {
    constructor() {
        super('transactions');
    }

    readSelectResponse(values: Value[][]): Transaction[] {
        const collection: Transaction[] = [];
        values.forEach((valueRow) => {
            collection.push({
                transactionId: valueRow[0],
                accountId: valueRow[1],
                importedDate: valueRow[2],
                categoryId: valueRow[3],
                userComment: valueRow[4],
                overridePostingDate: valueRow[5],
                overrideDescription: typeof valueRow[6] === "string" ? unescape(valueRow[6]) : valueRow[6],
                serviceType: valueRow[7],
                overrideCategory: valueRow[8],
                transactionStatus: valueRow[9],
                processingStatus: valueRow[10],

                chaseTransaction: {
                    Details: typeof valueRow[11] === "string" ? unescape(valueRow[11]) : valueRow[11],
                    PostingDate: valueRow[12],
                    Description: typeof valueRow[13] === "string" ? unescape(valueRow[13]) : valueRow[13],
                    Amount: valueRow[14],
                    Type: valueRow[15],
                    Balance: valueRow[16],
                    CheckOrSlip: typeof valueRow[17] === "string" ? unescape(valueRow[17]) : valueRow[17],
                    CreditCardTransactionType: valueRow[19],
                    BankDefinedCategory: valueRow[20],
                },

                businessId: valueRow[18],
            } as Transaction);
        });

        return collection;
    }
}

export const transactionPostgresDataController: DatabaseController<Transaction> = new TransactionPostgresController();
