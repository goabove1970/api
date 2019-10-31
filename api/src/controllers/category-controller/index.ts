import { categoryPersistanceController } from '../persistence-controller/category/CatgoryPersistanceController';
import { Category } from '@src/models/category/category';
import { DeepPartial } from '@src/models/DeepPartial';
import { ReadCategoryArgs } from '@src/models/category/GetCategoryArgs';
import { CreateCategoryArgs } from '@src/models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@src/models/category/DeleteCategoryArgs';

export abstract class CategoryControllerBase {
    abstract read(args: ReadCategoryArgs): DeepPartial<Category>[];

    abstract create(args: CreateCategoryArgs): string;
    abstract update(args: CreateCategoryArgs);
    abstract delete(args: DeleteCategoryArgs);
}

export class CategoryController implements CategoryControllerBase {
    delete(args: DeleteCategoryArgs) {
        return categoryPersistanceController.delete(args);
    }
    read(args: ReadCategoryArgs): DeepPartial<Category>[] {
        return categoryPersistanceController.read(args);
    }
    create(args: CreateCategoryArgs): string {
        return categoryPersistanceController.create(args);
    }
    update(args: CreateCategoryArgs) {
        return categoryPersistanceController.update(args);
    }
}

const categoryController: CategoryControllerBase = new CategoryController();
export default categoryController;
