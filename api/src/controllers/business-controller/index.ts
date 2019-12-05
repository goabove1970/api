import { DeepPartial } from '@src/models/DeepPartial';
import { BusinessDeleteArgs } from '@root/src/models/business/BusinessDeleteArgs';
import { BusinessReadArgs } from '@root/src/models/business/BusinessReadArgs';
import { BusinessCreateArgs } from '@root/src/models/business/BusinessCreateArgs';
import { Business } from '@root/src/models/business/business';
import { businessPersistanceController } from '../data-controller/business/BusinessPersistanceController';
import { BusinessPersistanceControllerBase } from '../data-controller/business/BusinessPersistanceControllerBase';

export class BusinessesController implements BusinessPersistanceControllerBase {
    delete(args: BusinessDeleteArgs): Promise<void> {
        return businessPersistanceController.delete(args);
    }
    read(args: BusinessReadArgs): Promise<DeepPartial<Business>[]> {
        return businessPersistanceController.read(args);
    }
    create(args: BusinessCreateArgs): Promise<string> {
        return businessPersistanceController.create(args);
    }
    update(args: BusinessCreateArgs): Promise<void> {
        return businessPersistanceController.update(args);
    }
}

const businessesController: BusinessPersistanceControllerBase = new BusinessesController();
export default businessesController;
