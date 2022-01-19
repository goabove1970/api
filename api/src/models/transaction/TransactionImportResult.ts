export interface TransactionImportResult {
    parsed: number;
    duplicates: number;
    newTransactions: number;
    toBeDeleted: number;
    businessRecognized: number;
    multipleBusinessesMatched: number;
    unrecognized: number;
    unposted: number;
}
