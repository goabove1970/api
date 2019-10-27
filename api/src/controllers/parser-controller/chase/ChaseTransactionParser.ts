import { parseAmount, parseBalance } from '../../../controllers/parser-controller/helper';
import { Parser } from '../Parser';
import { parseChaseTransDetails, parseChaseTransactionType } from './ChaseParseHelper';
import * as moment from 'moment';
import { ChaseTransaction } from '../../../models/transaction/chase/ChaseTransaction';
import { ParseError } from '../../../models/errors/parse-error';

export class ChaseTransactionParser implements Parser<ChaseTransaction> {
  private chaseCsvHeader = 'Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #';
  private lineSeparator = '\n\r';
  getFileHeader(): string {
    return this.chaseCsvHeader;
  }
  itemToCsv(t: ChaseTransaction): string {
    const line = `${t.Details!.toString()},${moment(t.PostingDate).toString()},${t.Description},${
      t.Amount ? t.Amount!.toString() : undefined
    },${t.Type!.toString()},${t.Balance ? t.Balance!.toString() : undefined},${t.CheckOrSlip}`;
    return line;
  }
  itemsToFileString(transactions: ChaseTransaction[]): string {
    const csvLines: string[] = [this.getFileHeader()];
    transactions.forEach((t) => csvLines.push(this.itemToCsv(t)));
    return csvLines.join(this.lineSeparator).concat(this.lineSeparator);
  }
  parseLine(line: string): ChaseTransaction | undefined {
    try {
      const parts = line.split(',');
      if (parts.length >= 7) {
        return {
          Details: parseChaseTransDetails(parts[0]),
          PostingDate: new Date(parts[1]),
          Description: parts[2],
          Amount: parseAmount(parts[3]),
          Type: parseChaseTransactionType(parts[4]),
          Balance: parseBalance(parts[5]),
          CheckOrSlip: parts[6],
        } as ChaseTransaction;
      } else {
        throw {
          message: 'Not enough parts in passed string, at least 7 expected',
          originalString: line,
        };
      }
    } catch (error) {
      const parseError = error as ParseError;
      if (parseError !== undefined) {
        parseError.originalString = line;
        console.log(`ParseError: ${JSON.stringify(error, null, 4)}`);
        throw parseError;
      }
      console.log(error);
      throw {
        message: `Error Parsing ransaction: ${error.message}`,
        originalString: line,
      };

      return undefined;
    }
  }
  parseLines(lines: string[]): ChaseTransaction[] {
    return lines
      .map((m) => m.replace('\r', '').replace('\r', ''))
      .filter((s) => !!s && s.length > 0)
      .map((line: string) => {
        return this.parseLine(line);
      })
      .filter((r) => (r as ChaseTransaction) !== undefined)
      .map((r) => r as ChaseTransaction);
  }
  parseFile(flie: string): ChaseTransaction[] {
    let lines = flie.split(/\n/);
    return this.parseChunk(lines.splice(1));
  }
  private parseChunk = (lines: string[]): ChaseTransaction[] => {
    return this.parseLines(lines);
  };
}
