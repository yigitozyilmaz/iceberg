import api from "./api";

export class AgentService {
    static async getAll() {
        try {
            const response = await api.get("/Agents", {
                params: {
                    maxRecords: 100,
                    view: "Grid view"
                }
            });

            return response.data.records;
        } catch (error) {
            console.error("Error fetching agents:", error);
            throw error;
        }
    }

    static async getByIds(ids) {
        try {
            const filterFormula = `OR(${ids.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
            const response = await api.get("/Agents", {
                params: {
                    filterByFormula: filterFormula,
                    maxRecords: 100,
                    view: "Grid view"
                }
            });

            return response.data.records;
        } catch (error) {
            console.error("Error fetching agents by ids:", error);
            throw error;
        }
    }
}