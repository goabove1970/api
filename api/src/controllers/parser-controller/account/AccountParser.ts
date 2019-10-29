import { parseNumber } from '@controllers/parser-controller/helper';
import { Parser } from '../Parser';
import { ParseError } from '@models/errors/parse-error';
import { UserAccount } from '@models/accounts/Account';

export class AccountParser implements Parser<UserAccount> {
  private accountHeader = 'accountId,userId,routingNumber,accountNumber,bankName,createDate,status';
  private lineSeparator = '\n\r';

  getFileHeader(): string {
    return this.accountHeader;
  }

  itemToCsv(t: UserAccount): string {
    const line = `${t.accountId},${t.userId},${t.bankRoutingNumber},${t.bankAccountNumber},${t.bankName},${
      t.createDate
    },${t.status ? t.status!.toString() : undefined}`;
    return line;
  }

  itemsToFileString(user: UserAccount[]): string {
    const csvLines: string[] = [this.getFileHeader()];
    user.forEach((t) => csvLines.push(this.itemToCsv(t)));
    return csvLines.join(this.lineSeparator).concat(this.lineSeparator);
  }

  parseLine(line: string): UserAccount | undefined {
    try {
      const parts = line.split(',');
      if (parts.length >= 7) {
        return {
          accountId: parts[0],
          userId: parts[1],
          bankRoutingNumber: parts[2] ? parseNumber(parts[2]) : 0,
          bankAccountNumber: parts[3] ? parseNumber(parts[3]) : 0,
          bankName: parts[4],
          createDate: parts[5] ? new Date(parts[5]) : undefined,
          status: parts[6] ? parseNumber(parts[6]) : 0,
        } as UserAccount;
      } else {
        throw {
          message: 'Not enough parts in passed string, at least 12 expected',
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
        message: `Error Parsing user: ${error.message}`,
        originalString: line,
      };

      return undefined;
    }
  }

  parseLines(lines: string[]): UserAccount[] {
    return lines
      .map((m) => m.replace('\r', '').replace('\r', ''))
      .filter((s) => !!s && s.length > 0)
      .map((line: string) => {
        return this.parseLine(line);
      })
      .filter((r) => (r as UserAccount) !== undefined)
      .map((r) => r as UserAccount);
  }

  parseFile(flie: string): UserAccount[] {
    let lines = flie.split(/\n/);
    return this.parseChunk(lines.splice(1));
  }

  private parseChunk = (lines: string[]): UserAccount[] => {
    return this.parseLines(lines);
  };
}
