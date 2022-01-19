import { Transaction } from './transaction';

export interface MergeResult {
    toBeAdded: Transaction[];
    toBeRemoved: Transaction[];
}
