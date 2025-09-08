import api from "./api";

export class AppointmentService {
    static async getAll() {
        try {
            const response = await api.get("/Appointments", {
                params: {
                    maxRecords: 100,
                    view: "Grid view"
                }
            });

            console.log("API Response:", response);
            return response.data.records;
        } catch (error) {
            console.error("Error fetching appointments:", error);
            throw error;
        }
    }
}