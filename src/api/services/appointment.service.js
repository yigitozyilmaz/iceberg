import { BaseService } from './base.service';

export class AppointmentService extends BaseService {
    static get entity() {
        return 'appointments';
    }

    static async getAppointments() {
        return this.get();
    }

    static async getAppointmentById(id) {
        return this.getById(id);
    }

    static async createAppointment(appointmentData) {
        const requiredFields = ['contact_name', 'contact_email', 'appointment_date', 'appointment_address'];
        const missingFields = requiredFields.filter(field => !appointmentData[field]);

        if (missingFields.length > 0) {
            throw this.errorWrapper({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        return this.create(appointmentData);
    }

    static async updateAppointment(id, appointmentData) {
        return this.update(id, appointmentData);
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