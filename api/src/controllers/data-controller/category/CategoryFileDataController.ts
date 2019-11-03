import { FileController } from '../FileController';
import { CachedDataController } from '../CachedDataController';
import { Category } from '@src/models/category/category';
import { CategoryParser } from '@src/controllers/parser-controller/category/CategoryParser';

export class CategoryFileDataController extends FileController<Category> {
    constructor(filename: string) {
        super(filename, new CategoryParser());
    }
}

export const categoryFileDataController: CachedDataController<Category> = new CategoryFileDataController(
    'categories.csv'
);
