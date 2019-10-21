import { Transaction } from "../../models/transaction/transaction";
import { ParseError } from "../../models/parsers/parse-error";
import { ChaseParseController } from "./chase-transaction-parser";

export abstract class PraserController {

    abstract parseLine(line: string): Transaction | ParseError;
    
    abstract parseLines(lines: string[]): Transaction[];

    abstract parseFile(flie: string): Transaction[];

    abstract transacitonToCsv(transaction: Transaction): string;

    abstract transacitonsToFileString(transactions: Transaction[]): string;
}

export const chaseParseController: PraserController = new ChaseParseController();
