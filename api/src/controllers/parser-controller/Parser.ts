import { ParseError } from "@models/errors/parse-error";

export abstract class Parser<T> {
  abstract getFileHeader(): string;
  abstract parseLine(line: string): T | ParseError;
  abstract parseLines(lines: string[]): T[];
  abstract parseFile(flie: string): T[];
  abstract itemToCsv(item: T): string;
  abstract itemsToFileString(items: T[]): string;
}
