import { DeepPartial } from '@models/DeepPartial';
import { Category } from '@src/models/category/category';
import { ReadCategoryArgs } from '@src/models/category/GetCategoryArgs';
import { CreateCategoryArgs } from '@src/models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@src/models/category/DeleteCategoryArgs';

export abstract class CategoryPersistanceControllerReadonlyBase {
    abstract read(args: ReadCategoryArgs): DeepPartial<Category>[];
}

export abstract class CategoryPersistanceControllerBase extends CategoryPersistanceControllerReadonlyBase {
    abstract create(args: CreateCategoryArgs): string;
    abstract update(args: CreateCategoryArgs);
    abstract delete(args: DeleteCategoryArgs);
}
