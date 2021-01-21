import { CategoryPersistanceController, categoryPersistanceController } from '../data-controller/category/CatgoryPersistanceController';
import { Category } from '@models/category/category';
import { DeepPartial } from '@models/DeepPartial';
import { ReadCategoryArgs } from '@models/category/GetCategoryArgs';
import { CreateCategoryArgs } from '@models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@models/category/DeleteCategoryArgs';
import { CategoryPersistanceControllerBase } from '@controllers/data-controller/category/CategoryPersistanceControllerBase';

export class CategoryController implements CategoryPersistanceControllerBase {
    dataController: CategoryPersistanceController;
    
    constructor(dataController: CategoryPersistanceController) {
        this.dataController = dataController;
    }

    delete(args: DeleteCategoryArgs): Promise<void> {
        return this.dataController.delete(args);
    }
    read(args: ReadCategoryArgs): Promise<DeepPartial<Category>[]> {
        return this.dataController.read(args);
    }
    create(args: CreateCategoryArgs): Promise<string> {
        return this.dataController.create(args);
    }
    update(args: CreateCategoryArgs): Promise<void> {
        return this.dataController.update(args);
    }
}

const categoryController: CategoryPersistanceControllerBase = new CategoryController(categoryPersistanceController);
export default categoryController;
