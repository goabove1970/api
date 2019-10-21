import { Transaction } from "../../models/transaction/transaction";
import { ParseError } from "../../models/parsers/parse-error";
import { parseChaseTransDetails, parseAmount, parseTransactionType, parseBalance } from "./helper";
import { PraserController } from "../parser-controller";

const chaseCsvHeader = 'Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #';
const lineSeparator = '\n\r';

export class ChaseParseController implements PraserController {
    
    transacitonToCsv(t: Transaction): string {
        const line = `${t.Details!.toString()},${t.PostingDate.toTimeString()},${
            t.Description},${t.Amount ? t.Amount!.toString() : undefined},${t.Type!.toString()},${
                t.Balance ? t.Balance!.toString() : undefined},${t.CheckOrSlip}`;

        return line;
    }

    transacitonsToFileString(transactions: Transaction[]): string {
        const csvLines: string[] = [chaseCsvHeader];
        transactions.forEach(t => csvLines.push(this.transacitonToCsv(t)));
        return transactions.join(lineSeparator).concat(lineSeparator);
    }
    parseLine(line: string): Transaction | ParseError {
       try {
             const parts = line.split(',');
            if (parts.length >= 7) {
                return {
                  Details: parseChaseTransDetails(parts[0]),
                  PostingDate: new Date(parts[1]),
                  Description: parts[2],
                  Amount: parseAmount(parts[3]),
                  Type: parseTransactionType(parts[4]),
                  Balance: parseBalance(parts[5]),
                  CheckOrSlip: parts[6]
    
                } as Transaction;
            } else {
                throw {
                    message: 'Not enough parts in passed string, at least 7 expected',
                    originalString: line
                }
            }
        }
        catch (error) {
            const parseError = error as ParseError;
            if (parseError !== undefined) {
                parseError.originalString = line;
                console.log(`ParseError: ${JSON.stringify(error, null, 4)}`);
                return parseError;
            }
            console.log(error);
            return {
                message: `Error Parsing ransaction: ${error.message}`,
                originalString: line
            }
        }
    }
    
    parseLines(lines: string[]): Transaction[] {
        return lines.filter((s) => !!s && s.length > 0).map((line: string) => {
            return this.parseLine(line);
        }).filter((r) => r as Transaction !== undefined).map(r => r as Transaction);
    }

    parseFile(flie: string): Transaction[] {
        let lines = flie.split(/\n/);
        return this.parseChunk(lines.splice(1));
    }
            
    private parseChunk = (lines: string[]): Transaction[] => {
        return this.parseLines(lines);
    }
    
}