import { FileController } from '../FileController';
import { DataController } from '../DataController';
import { Category } from '@src/models/category/category';
import { CategoryParser } from '@src/controllers/parser-controller/category/CategoryParser';

export class CategoryFileDataController extends FileController<Category> {
    constructor(filename: string) {
        super(filename, new CategoryParser());
    }
}

export const categoryFileDataController: DataController<Category> = new CategoryFileDataController('categories.csv');
