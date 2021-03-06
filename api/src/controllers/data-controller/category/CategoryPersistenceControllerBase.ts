import { DeepPartial } from '@models/DeepPartial';
import { Category } from '@models/category/category';
import { ReadCategoryArgs } from '@models/category/GetCategoryArgs';
import { CreateCategoryArgs } from '@models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@models/category/DeleteCategoryArgs';

export abstract class CategoryPersistenceControllerReadonlyBase {
    abstract read(args: ReadCategoryArgs): Promise<DeepPartial<Category>[]>;
}

export abstract class CategoryPersistenceControllerBase extends CategoryPersistenceControllerReadonlyBase {
    abstract create(args: CreateCategoryArgs): Promise<string>;
    abstract update(args: CreateCategoryArgs): Promise<void>;
    abstract delete(args: DeleteCategoryArgs): Promise<void>;
}
