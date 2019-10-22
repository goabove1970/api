export abstract class DataController<T> {
    cache: T[];
    abstract cacheAllRecords(): number;
    abstract commitAllRecords(): number;
}
