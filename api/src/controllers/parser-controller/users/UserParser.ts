import { parseNumber } from '../../../controllers/parser-controller/helper';
import { Parser } from '../Parser';
import { UserDetails } from '../../../models/user';
import * as moment from 'moment';
import { ParseError } from 'src/models/errors/parse-error';

export class UserParser implements Parser<UserDetails> {
  private userHeader =
    'userId,login,email,firstName,lastName,ssn,password,dob,lastLogin,accountCreated,serviceComment,status';
  private lineSeparator = '\n\r';

  getFileHeader(): string {
    return this.userHeader;
  }

  itemToCsv(t: UserDetails): string {
    const line = `${t.userId},${t.login},${t.email},${t.firstName},${t.lastName},${
      t.ssn ? t.ssn!.toString() : undefined
    },${t.password},${moment(t.dob).toString()},${t.lastLogin ? moment(t.lastLogin!).toString() : undefined},${
      t.accountCreated ? moment(t.accountCreated!).toString() : undefined
    },${t.serviceComment},${t.status ? t.status!.toString() : undefined}`;
    return line;
  }

  itemsToFileString(user: UserDetails[]): string {
    const csvLines: string[] = [this.getFileHeader()];
    user.forEach((t) => csvLines.push(this.itemToCsv(t)));
    return csvLines.join(this.lineSeparator).concat(this.lineSeparator);
  }

  parseLine(line: string): UserDetails | undefined {
    try {
      const parts = line.split(',');
      if (parts.length >= 7) {
        return {
          userId: parts[0],
          login: parts[1],
          email: parts[2],
          firstName: parts[3],
          lastName: parts[4],
          ssn: parts[5] ? parseNumber(parts[5]) : 0,
          password: parts[6],
          dob: new Date(parts[7]),
          lastLogin: parts[8] ? new Date(parts[8]) : undefined,
          accountCreated: parts[9] ? new Date(parts[9]) : undefined,
          serviceComment: parts[10],
          status: parts[11] ? parseNumber(parts[11]) : 0,
        } as UserDetails;
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

  parseLines(lines: string[]): UserDetails[] {
    return lines
      .map((m) => m.replace('\r', '').replace('\r', ''))
      .filter((s) => !!s && s.length > 0)
      .map((line: string) => {
        return this.parseLine(line);
      })
      .filter((r) => (r as UserDetails) !== undefined)
      .map((r) => r as UserDetails);
  }

  parseFile(flie: string): UserDetails[] {
    let lines = flie.split(/\n/);
    return this.parseChunk(lines.splice(1));
  }

  private parseChunk = (lines: string[]): UserDetails[] => {
    return this.parseLines(lines);
  };
}
