import { ResponseBase } from './Requests';
import { CreateCategoryArgs } from '@models/category/CreateCategoryArgs';
import { DeleteCategoryArgs } from '@models/category/DeleteCategoryArgs';
import { ReadCategoryArgs } from '@models/category/GetCategoryArgs';
import { DeepPartial } from '@models/DeepPartial';
import { Category } from '@models/category/category';

export enum CategoryRequestType {
    Read = 'read',
    Create = 'create',
    Delete = 'delete',
    Update = 'update',
}

export interface CategoryRequest {
    action?: CategoryRequestType;
    args?: CreateCategoryArgs & DeleteCategoryArgs & ReadCategoryArgs;
}

export interface CategoryResponse extends ResponseBase {
    action?: CategoryRequestType;
    payload?: {
        categoryId?: string;
        count?: number;
        categories?: DeepPartial<Category>[];
    };
}
