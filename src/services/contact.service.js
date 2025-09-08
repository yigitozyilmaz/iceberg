import api from "./api";

export class ContactService {
    static async getAll() {
        try {
            const response = await api.get("/Contacts", {
                params: {
                    maxRecords: 100,
                    view: "Grid view"
                }
            });

            return response.data.records;
        } catch (error) {
            console.error("Error fetching contacts:", error);
            throw error;
        }
    }

    static async search(query) {
        try {
            const response = await api.get("/Contacts", {
                params: {
                    filterByFormula: `OR(
                        SEARCH('${query.toLowerCase()}', LOWER({contact_name})),
                        SEARCH('${query.toLowerCase()}', LOWER({contact_email}))
                    )`,
                    maxRecords: 100,
                    view: "Grid view"
                }
            });

            return response.data.records;
        } catch (error) {
            console.error("Error searching contacts:", error);
            throw error;
        }
    }
}