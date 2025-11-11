import contactsData from '../../data/contacts.json';

export class ContactService {
    static async getContacts(options = {}) {
        try {
            // Simulate API response with static data
            return {
                success: true,
                data: contactsData,
                status: 200
            };
        } catch (error) {
            throw {
                success: false,
                data: null,
                status: 500,
                message: 'Failed to load contacts'
            };
        }
    }

    static async getAllContacts() {
        try {
            // Return all contacts from static data
            return {
                success: true,
                data: contactsData,
                status: 200
            };
        } catch (error) {
            throw {
                success: false,
                data: null,
                status: 500,
                message: 'Failed to load contacts'
            };
        }
    }
}

export default ContactService;
