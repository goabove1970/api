"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("./helper");
const chaseCsvHeader = 'Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #';
const lineSeparator = '\n\r';
class ChaseParseController {
    constructor() {
        this.parseChunk = (lines) => {
            return this.parseLines(lines);
        };
    }
    transacitonToCsv(t) {
        const line = `${t.Details.toString()},${t.PostingDate.toTimeString()},${t.Description},${t.Amount ? t.Amount.toString() : undefined},${t.Type.toString()},${t.Balance ? t.Balance.toString() : undefined},${t.CheckOrSlip}`;
        return line;
    }
    transacitonsToFileString(transactions) {
        const csvLines = [chaseCsvHeader];
        transactions.forEach(t => csvLines.push(this.transacitonToCsv(t)));
        return transactions.join(lineSeparator).concat(lineSeparator);
    }
    parseLine(line) {
        try {
            const parts = line.split(',');
            if (parts.length >= 7) {
                return {
                    Details: helper_1.parseChaseTransDetails(parts[0]),
                    PostingDate: new Date(parts[1]),
                    Description: parts[2],
                    Amount: helper_1.parseAmount(parts[3]),
                    Type: helper_1.parseTransactionType(parts[4]),
                    Balance: helper_1.parseBalance(parts[5]),
                    CheckOrSlip: parts[6]
                };
            }
            else {
                throw {
                    message: 'Not enough parts in passed string, at least 7 expected',
                    originalString: line
                };
            }
        }
        catch (error) {
            const parseError = error;
            if (parseError !== undefined) {
                parseError.originalString = line;
                console.log(`ParseError: ${JSON.stringify(error, null, 4)}`);
                return parseError;
            }
            console.log(error);
            return {
                message: `Error Parsing ransaction: ${error.message}`,
                originalString: line
            };
        }
    }
    parseLines(lines) {
        return lines.filter((s) => !!s && s.length > 0).map((line) => {
            return this.parseLine(line);
        }).filter((r) => r !== undefined).map(r => r);
    }
    parseFile(flie) {
        let lines = flie.split(/\n/);
        return this.parseChunk(lines.splice(1));
    }
}
exports.ChaseParseController = ChaseParseController;
//# sourceMappingURL=chase-transaction-parser.js.map