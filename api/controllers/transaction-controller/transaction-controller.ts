import { chaseParseController } from "../parser-controller";
import { ParseError } from "../../models/parsers/parse-error";
import { Transaction } from "../../models/transaction/transaction";

export class TransactionController {
    readTransaction(transactionId: string) {};

    addTransactionFromLine(line: string): Transaction | ParseError {
        return chaseParseController.parseLine(line);
    }
}