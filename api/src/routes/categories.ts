import { Router } from 'express';

import { CategoryError } from '@models/errors/errors';
import { CategoryRequest, CategoryRequestType, CategoryResponse } from './request-types/CategoryRequest';
import { CreateCategoryArgs } from '@src/models/category/CreateCategoryArgs';
import controller from '@src/controllers/category-controller';
import { ReadCategoryArgs } from '@src/models/category/GetCategoryArgs';
import { DeleteCategoryArgs } from '@src/models/category/DeleteCategoryArgs';

const router = Router();

router.get('/', async function(req, res, next) {
    // console.log(`Received a request in category controller: ${JSON.stringify(req.body, null, 4)}`);
    const request = req.body as CategoryRequest;
    if (!request) {
        return res.status(500).send(new CategoryError('Empty category request'));
    }

    let responseData: CategoryResponse = {};

    console.log(`Processing ${request.action} category request`);
    switch (request.action) {
        case CategoryRequestType.Create:
            responseData = await processCreateCategoryRequest(request.args);
            break;
        case CategoryRequestType.Update:
            responseData = await processUpdateCategoryRequest(request.args);
            break;
        case CategoryRequestType.Delete:
            responseData = await processDeleteCategoryRequest(request.args);
            break;
        case CategoryRequestType.Read:
            responseData = await processReadCategoryRequest(request.args);
            break;
        default:
            const enumKeys = [];
            for (var enumMember in CategoryRequestType) {
                enumKeys.push(CategoryRequestType[enumMember]);
            }

            const availableRequestTypes = enumKeys.join(', ');
            return res
                .status(500)
                .send(
                    new CategoryError(
                        `Unknown category request type: ${request.action}, try [${availableRequestTypes}]`
                    )
                );
    }

    res.send(responseData);
});

async function processReadCategoryRequest(request: ReadCategoryArgs): Promise<CategoryResponse> {
    const response: CategoryResponse = {
        action: CategoryRequestType.Read,
        payload: {},
    };

    try {
        await controller
            .read(request)
            .then((collection) => {
                response.payload = {
                    count: collection.length,
                    categories: collection,
                };
            })
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processCreateCategoryRequest(request: CreateCategoryArgs): Promise<CategoryResponse> {
    const response: CategoryResponse = {
        action: CategoryRequestType.Create,
        payload: {},
    };

    try {
        await controller
            .create(request)
            .then((categoryId) => {
                response.payload = {
                    categoryId,
                };
            })
            .catch((error) => {
                throw error;
            });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processDeleteCategoryRequest(request: DeleteCategoryArgs): Promise<CategoryResponse> {
    const response: CategoryResponse = {
        action: CategoryRequestType.Delete,
        payload: {},
    };

    try {
        await controller.delete(request).catch((error) => {
            throw error;
        });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

async function processUpdateCategoryRequest(request: CreateCategoryArgs): Promise<CategoryResponse> {
    const response: CategoryResponse = {
        action: CategoryRequestType.Update,
        payload: {},
    };
    try {
        await controller.update(request).catch((error) => {
            throw error;
        });
    } catch (error) {
        console.error(error.message);
        response.error = error.message;
    }
    return response;
}

export = router;
