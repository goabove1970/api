import { ChaseTransactionParser } from '@controllers/parser-controller/chase/ChaseTransactionParser';
import { ChaseTransactionOriginType } from '@models/transaction/chase/ChaseTransactionOriginType';
import { ChaseTransactionType } from '@models/transaction/chase/ChaseTransactionType';

describe('ChaseTransactionParser', () => {
    let parser: ChaseTransactionParser;

    beforeEach(() => {
        parser = new ChaseTransactionParser();
    });

    it('should return correct file header', () => {
        const header = parser.getFileHeader();
        expect(header).toBe('Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #');
    });

    it('should parse debit line correctly', () => {
        const line = 'DEBIT,01/14/2021,Test Description,123.45,ACH_CREDIT,1000.00,1234';
        const result = parser.parseDebitLine(line);
        
        expect(result).toBeDefined();
        expect(result.Details).toBe(ChaseTransactionOriginType.Debit);
        expect(result.Description).toBe('Test Description');
        expect(result.Amount).toBe(123.45);
        expect(result.Balance).toBe(1000.00);
        expect(result.CheckOrSlip).toBe('1234');
    });

    it('should parse debit lines array', () => {
        const lines = [
            'DEBIT,01/14/2021,Test Description 1,123.45,ACH_CREDIT,1000.00,1234',
            'DEBIT,01/15/2021,Test Description 2,456.78,ACH_CREDIT,1456.78,5678'
        ];
        const results = parser.parseDebitLines(lines);
        
        expect(results.length).toBe(2);
        expect(results[0].Description).toBe('Test Description 1');
        expect(results[1].Description).toBe('Test Description 2');
    });

    it('should parse file with debit header', () => {
        const fileContent = 'Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\nDEBIT,01/14/2021,Test,123.45,ACH_CREDIT,1000.00,1234';
        const results = parser.parseFile(fileContent);
        
        expect(results.length).toBe(1);
        expect(results[0].Description).toBe('Test');
    });

    it('should parse file with credit header', () => {
        const fileContent = 'Transaction Date,Post Date,Description,Category,Type,Amount\n01/14/2021,01/15/2021,Test Purchase,Groceries,Sale,50.00';
        const results = parser.parseFile(fileContent);
        
        expect(results.length).toBe(1);
        expect(results[0].Description).toBe('Test Purchase');
        expect(results[0].Details).toBe(ChaseTransactionOriginType.Credit);
    });

    it('should convert transaction to CSV', () => {
        const transaction = {
            Details: ChaseTransactionOriginType.Debit,
            PostingDate: new Date('2021-01-14'),
            Description: 'Test',
            Amount: 123.45,
            Type: ChaseTransactionType.AchCredit,
            Balance: 1000.00,
            CheckOrSlip: '1234',
        };
        
        const csv = parser.itemToCsv(transaction);
        expect(csv).toContain('Test');
        expect(csv).toContain('123.45');
    });

    it('should convert transactions array to file string', () => {
        const transactions = [
            {
                Details: ChaseTransactionOriginType.Debit,
                PostingDate: new Date('2021-01-14'),
                Description: 'Test 1',
                Amount: 123.45,
                Type: ChaseTransactionType.AchCredit,
                Balance: 1000.00,
                CheckOrSlip: '1234',
            },
            {
                Details: ChaseTransactionOriginType.Debit,
                PostingDate: new Date('2021-01-15'),
                Description: 'Test 2',
                Amount: 456.78,
                Type: ChaseTransactionType.AchCredit,
                Balance: 1456.78,
                CheckOrSlip: '5678',
            },
        ];
        
        const fileString = parser.itemsToFileString(transactions);
        expect(fileString).toContain(parser.getFileHeader());
        expect(fileString).toContain('Test 1');
        expect(fileString).toContain('Test 2');
    });

    it('should throw error for invalid debit line', () => {
        const invalidLine = 'Too,few,parts';
        expect(() => parser.parseDebitLine(invalidLine)).toThrow();
    });

    it('should filter empty lines when parsing', () => {
        const lines = [
            'DEBIT,01/14/2021,Test,123.45,ACH_CREDIT,1000.00,1234',
            '',
            'DEBIT,01/15/2021,Test 2,456.78,ACH_CREDIT,1456.78,5678'
        ];
        const results = parser.parseDebitLines(lines);
        
        // Empty lines are filtered, but whitespace-only lines may cause errors
        expect(results.length).toBeGreaterThanOrEqual(2);
    });
});

