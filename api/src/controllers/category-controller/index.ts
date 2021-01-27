import { CategoryPersistenceController, categoryPersistenceController } from '@controllers/data-controller/category/CatgoryPersistenceController';
import { Category } from '@models/category/category';
import { DeepPartial } from '@models/DeepPartial';
import { ReadCategoryArgs } from '@models/category/GetCategoryArgs';
import { CreateCategoryArgs } from '@models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@models/category/DeleteCategoryArgs';
import { CategoryPersistenceControllerBase } from '@controllers/data-controller/category/CategoryPersistenceControllerBase';

export class CategoryController implements CategoryPersistenceControllerBase {
    dataController: CategoryPersistenceController;
    
    constructor(dataController: CategoryPersistenceController) {
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

const categoryController: CategoryPersistenceControllerBase = new CategoryController(categoryPersistenceController);
export default categoryController;
