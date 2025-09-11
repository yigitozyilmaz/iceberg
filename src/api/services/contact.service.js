import { BaseService } from './base.service';

export class ContactService extends BaseService {
    static get entity() {
        return 'contacts';
    }

    static async getContacts(options = {}) {
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

    static async getAllContacts() {
        try {
            // Tüm contact'ları pagination ile çek
            let allRecords = [];
            let offset = null;

            do {
                const params = {
                    view: 'Grid view',
                    pageSize: 100, // Maximum per request
                    fields: ['contact_id', 'contact_name', 'contact_email', 'contact_phone'] // contact_id de ekle
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
}

export default ContactService;
