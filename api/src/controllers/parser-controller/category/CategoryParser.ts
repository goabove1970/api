import { parseNumber } from '@controllers/parser-controller/helper';
import { Parser } from '../Parser';
import { ParseError } from '@models/errors/parse-error';
import { Category } from '@models/category/category';

export class CategoryParser implements Parser<Category> {
    private categoryHeader = 'categoryId,parentCategoryId,caption,categoryType';
    private lineSeparator = '\n\r';

    getFileHeader(): string {
        return this.categoryHeader;
    }

    itemToCsv(t: Category): string {
        const line = `${t.categoryId},${t.parentCategoryId},${t.caption},${t.categoryType}`;
        return line;
    }

    itemsToFileString(user: Category[]): string {
        const csvLines: string[] = [this.getFileHeader()];
        user.forEach((t) => csvLines.push(this.itemToCsv(t)));
        return csvLines.join(this.lineSeparator).concat(this.lineSeparator);
    }

    parseLine(line: string): Category | undefined {
        try {
            const parts = line.split(',');
            if (parts.length >= 7) {
                return {
                    categoryId: parts[0],
                    parentCategoryId: parts[1],
                    caption: parts[2],
                    categoryType: parts[3] ? parseNumber(parts[3]) : 0,
                } as Category;
            } else {
                throw {
                    message: 'Not enough parts in passed string, at least 4 expected',
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
                message: `Error parsing category: ${error.message}`,
                originalString: line,
            };

            return undefined;
        }
    }

    parseLines(lines: string[]): Category[] {
        return lines
            .map((m) => m.replace('\r', '').replace('\r', ''))
            .filter((s) => !!s && s.length > 0)
            .map((line: string) => {
                return this.parseLine(line);
            })
            .filter((r) => (r as Category) !== undefined)
            .map((r) => r as Category);
    }

    parseFile(flie: string): Category[] {
        let lines = flie.split(/\n/);
        return this.parseChunk(lines.splice(1));
    }

    private parseChunk = (lines: string[]): Category[] => {
        return this.parseLines(lines);
    };
}
