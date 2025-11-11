import agentsData from '../../data/agents.json';

export class AgentService {
    static async getAgents(options = {}) {
        try {
            // Simulate API response with static data
            return {
                success: true,
                data: agentsData,
                status: 200
            };
        } catch (error) {
            throw {
                success: false,
                data: null,
                status: 500,
                message: 'Failed to load agents'
            };
        }
    }
}

export default AgentService;


