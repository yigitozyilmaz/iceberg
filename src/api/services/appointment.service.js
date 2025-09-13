import { BaseService } from './base.service';

export class AppointmentService extends BaseService {
    static get entity() {
        return 'appointments';
    }

    static async getAllAppointments() {
        try {
            // Tüm appointment'ları pagination ile çek (sort yok)
            let allRecords = [];
            let offset = null;

            do {
                const params = {
                    pageSize: 100 // Maximum per request
                };

                if (offset) {
                    params.offset = offset;
                }

                const response = await this.request.get(`/${this.entity}`, { params });
                const data = response.data;

                if (data.records) {
                    // BaseService responseWrapper formatına uygun şekilde process et
                    const processedRecords = data.records.map(record => ({
                        id: record.id,
                        createdTime: record.createdTime,
                        ...record.fields
                    }));

                    allRecords = allRecords.concat(processedRecords);
                }

                offset = data.offset; // Next page offset
            } while (offset);

            // ResponseWrapper format'ında döndür
            return {
                success: true,
                data: allRecords,
                status: 200
            };
        } catch (error) {
            throw this.errorWrapper(error);
        }
    }

    static async getAppointmentById(id) {
        return this.getById(id);
    }

    static async createAppointment(appointmentData) {
        const requiredFields = ['appointment_date', 'appointment_address'];
        const missingFields = requiredFields.filter(field => !appointmentData[field]);

        if (missingFields.length > 0) {
            throw this.errorWrapper({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Airtable için uygun format düzenle - SADECE manual fields
        // Computed fields gönderme: appointment_id, contact_name, contact_surname, contact_email, contact_phone, agent_name, agent_surname
        const cleanData = {};

        // Basic appointment fields
        if (appointmentData.appointment_address) {
            cleanData.appointment_address = appointmentData.appointment_address.toString();
        }

        if (appointmentData.appointment_date) {
            cleanData.appointment_date = new Date(appointmentData.appointment_date).toISOString();
        }

        // Contact - contact_id Airtable linked records array
        // Create aşamasında artık birden fazla contact destekliyoruz
        if (appointmentData.contact_id) {
            if (Array.isArray(appointmentData.contact_id)) {
                const valid = appointmentData.contact_id
                    .filter(Boolean)
                    .map(id => id.toString())
                    .filter(id => id.startsWith('rec') && id.length >= 17);
                if (valid.length > 0) {
                    cleanData.contact_id = valid; // Already array
                }
            } else {
                const single = appointmentData.contact_id.toString();
                if (single.startsWith('rec') && single.length >= 17) {
                    cleanData.contact_id = [single];
                }
            }
        }

        // Status - boolean field
        if (typeof appointmentData.is_cancelled !== 'undefined') {
            cleanData.is_cancelled = Boolean(appointmentData.is_cancelled);
        }

        // Agents - linked records array format (örneğe göre agent_id) - SADECE VALID ID'ler
        if (appointmentData.agents && Array.isArray(appointmentData.agents)) {
            const validAgents = appointmentData.agents
                .filter(Boolean)
                .filter(id => typeof id === 'string' && id.startsWith('rec') && id.length >= 17);
            if (validAgents.length > 0) {
                cleanData.agent_id = validAgents; // agent_id array format
            }
        }

        return this.create(cleanData);
    }

    static async updateAppointment(id, appointmentData) {
        // Update için tüm manual alanları gönder - PATCH için
        // Computed fields gönderme: appointment_id, contact_name, contact_surname, contact_email, contact_phone, agent_name, agent_surname
        const cleanData = {};

        // Required fields - always include
        if (appointmentData.appointment_address) {
            cleanData.appointment_address = appointmentData.appointment_address.toString();
        }

        if (appointmentData.appointment_date) {
            cleanData.appointment_date = new Date(appointmentData.appointment_date).toISOString();
        }

        // Contact - edit'te tekli kalacak; ancak API çoklu kabul edebilir
        if (appointmentData.contact_id) {
            if (Array.isArray(appointmentData.contact_id)) {
                const valid = appointmentData.contact_id
                    .filter(Boolean)
                    .map(id => id.toString())
                    .filter(id => id.startsWith('rec') && id.length >= 17);
                if (valid.length > 0) {
                    cleanData.contact_id = valid;
                }
            } else {
                const single = appointmentData.contact_id.toString();
                if (single.startsWith('rec') && single.length >= 17) {
                    cleanData.contact_id = [single];
                }
            }
        }

        // Status - always include
        if (typeof appointmentData.is_cancelled !== 'undefined') {
            cleanData.is_cancelled = Boolean(appointmentData.is_cancelled);
        }

        // Agents - linked records array format (örneğe göre agent_id) - SADECE VALID ID'ler
        if (appointmentData.agents && Array.isArray(appointmentData.agents)) {
            const validAgents = appointmentData.agents
                .filter(Boolean)
                .filter(id => typeof id === 'string' && id.startsWith('rec') && id.length >= 17);
            if (validAgents.length > 0) {
                cleanData.agent_id = validAgents; // agent_id array format
            } else {
                cleanData.agent_id = []; // Empty array if no valid agents
            }
        } else {
            cleanData.agent_id = []; // Empty array if no agents
        }
        return this.update(id, cleanData);
    }

    static async cancelAppointment(id) {
        return this.update(id, { is_cancelled: true });
    }

    static async assignAgents(id, agents) {
        if (!Array.isArray(agents)) {
            throw this.errorWrapper({
                message: 'Agents must be an array'
            });
        }

        return this.update(id, { agents });
    }
}