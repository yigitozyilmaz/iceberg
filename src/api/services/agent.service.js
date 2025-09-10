import { BaseService } from './base.service';

export class AgentService extends BaseService {
    static get entity() {
        return 'agents';
    }

    static async getAgents(options = {}) {
        const params = {
            view: 'Grid view',
            ...options,
        };

        try {
            const response = await this.request.get(`/${this.entity}`, { params });
            return this.responseWrapper(response);
        } catch (error) {
            throw this.errorWrapper(error);
        }
    }
}

export default AgentService;


