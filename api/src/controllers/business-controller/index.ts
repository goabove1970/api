import { BusinessDeleteArgs } from '@models/business/BusinessDeleteArgs';
import { BusinessReadArgs } from '@models/business/BusinessReadArgs';
import { BusinessCreateArgs } from '@models/business/BusinessCreateArgs';
import { Business } from '@models/business/Business';
import { BusinessPersistenceController, businessPersistenceController } from '@controllers/data-controller/business/BusinessPersistenceController';
import { BusinessPersistenceControllerBase } from '@controllers/data-controller/business/BusinessPersistenceControllerBase';
import { AddRuleArgs } from '@models/business/AddRuleArgs';

export class BusinessesController implements BusinessPersistenceControllerBase {
    persistenceController: BusinessPersistenceController;
    
    constructor(persistenceController: BusinessPersistenceController) {
        this.persistenceController = persistenceController;
    }

    async getCache(): Promise<{ businesses: Business[] }> {
        if (!this.cache) {
            await this.updateCache();
        }
        return this.cache;
    }
    cache: { businesses: Business[] } = undefined;

    async addRule(args: AddRuleArgs): Promise<void> {
        await this.persistenceController.addRule(args);
        await this.updateCache();
    }
    async updateCache() {
        this.cache = { businesses: await this.persistenceController.read({}) };
    }
    async delete(args: BusinessDeleteArgs): Promise<void> {
        await this.persistenceController.delete(args);
        await this.updateCache();
    }
    async read(args: BusinessReadArgs): Promise<Business[]> {
        if (!args.businessId && !args.categoryId && !args.name) {
            if (!this.cache) {
                await this.updateCache();
            }
            return this.cache.businesses;
        }
        return this.persistenceController.read(args);
    }
    async create(args: BusinessCreateArgs): Promise<string> {
        const businessId = await this.persistenceController.create(args);
        await this.updateCache();
        return businessId;
    }
    async update(args: BusinessCreateArgs): Promise<void> {
        await this.persistenceController.update(args);
        await this.updateCache();
    }
}

const businessesController = new BusinessesController(businessPersistenceController);
export default businessesController;
