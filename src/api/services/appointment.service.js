import appointmentsData from '../../data/appointments.json';

export class AppointmentService {
    static async getAllAppointments() {
        try {
            // Return all appointments from static data
            return {
                success: true,
                data: appointmentsData,
                status: 200
            };
        } catch (error) {
            throw {
                success: false,
                data: null,
                status: 500,
                message: 'Failed to load appointments'
            };
        }
    }

    static async getAppointmentById(id) {
        try {
            const appointment = appointmentsData.find(a => a.id === id);
            if (!appointment) {
                throw {
                    success: false,
                    data: null,
                    status: 404,
                    message: 'Appointment not found'
                };
            }
            return {
                success: true,
                data: appointment,
                status: 200
            };
        } catch (error) {
            throw {
                success: false,
                data: null,
                status: 500,
                message: 'Failed to get appointment'
            };
        }
    }

    static async createAppointment(appointmentData) {
        // Note: With static data, we cannot persist new appointments
        // This will show a success message but data won't persist after refresh
        console.warn('Create appointment called with static data - changes will not persist');
        
        try {
            // Simulate successful creation
            return {
                success: true,
                data: {
                    id: `recAppt${Date.now()}`,
                    createdTime: new Date().toISOString(),
                    ...appointmentData
                },
                status: 201
            };
        } catch (error) {
            throw {
                success: false,
                data: null,
                status: 500,
                message: 'Failed to create appointment'
            };
        }
    }

    static async updateAppointment(id, appointmentData) {
        // Note: With static data, we cannot persist updates
        // This will show a success message but data won't persist after refresh
        console.warn('Update appointment called with static data - changes will not persist');
        
        try {
            // Simulate successful update
            return {
                success: true,
                data: {
                    id,
                    ...appointmentData
                },
                status: 200
            };
        } catch (error) {
            throw {
                success: false,
                data: null,
                status: 500,
                message: 'Failed to update appointment'
            };
        }
    }

    static async cancelAppointment(id) {
        return this.updateAppointment(id, { is_cancelled: true });
    }

    static async assignAgents(id, agents) {
        if (!Array.isArray(agents)) {
            throw {
                success: false,
                data: null,
                status: 400,
                message: 'Agents must be an array'
            };
        }
        return this.updateAppointment(id, { agents });
    }
}