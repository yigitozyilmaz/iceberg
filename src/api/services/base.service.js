import axios from 'axios';
import { ResponseWrapper, ErrorWrapper } from './util';

export class BaseService {
    static get entity() {
        throw new Error('entity getter not defined');
    }

    static get request() {
        return axios.create({
            baseURL: import.meta.env.VITE_AIRTABLE_API_URL,
            headers: {
                "Authorization": `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
            }
        });
    }

    static responseWrapper(response) {
        try {
            if (response.data.records) {
                const records = response.data.records.map(record => ({
                    id: record.id,
                    createdTime: record.createdTime,
                    ...record.fields
                }));
                return new ResponseWrapper(response, records);
            }
            return new ResponseWrapper(response, response.data);
        } catch (error) {
            throw new ErrorWrapper({
                message: 'Failed to parse response',
                response: { status: 500, statusText: 'Internal Server Error' }
            });
        }
    }

    static errorWrapper(error) {
        return new ErrorWrapper(error);
    }

    static async get() {
        try {
            const response = await this.request.get(`/${this.entity}`);
            return this.responseWrapper(response);
        } catch (error) {
            throw this.errorWrapper(error);
        }
    }

    static async getById(id) {
        if (!id) throw this.errorWrapper({ message: 'ID is required' });

        try {
            const response = await this.request.get(`/${this.entity}/${id}`);
            return this.responseWrapper(response);
        } catch (error) {
            throw this.errorWrapper(error);
        }
    }

    static async create(data) {
        if (!data || typeof data !== 'object') {
            throw this.errorWrapper({ message: 'Invalid data provided' });
        }

        try {
            const response = await this.request.post(`/${this.entity}`, {
                records: [{ fields: data }]
            });
            return this.responseWrapper(response);
        } catch (error) {
            throw this.errorWrapper(error);
        }
    }

    static async update(id, data) {
        if (!id) throw this.errorWrapper({ message: 'ID is required' });
        if (!data || typeof data !== 'object') {
            throw this.errorWrapper({ message: 'Invalid data provided' });
        }

        try {
            const response = await this.request.patch(`/${this.entity}`, {
                records: [{ id, fields: data }]
            });
            return this.responseWrapper(response);
        } catch (error) {
            throw this.errorWrapper(error);
        }
    }

    static async delete(id) {
        if (!id) throw this.errorWrapper({ message: 'ID is required' });

        try {
            const response = await this.request.delete(`/${this.entity}/${id}`);
            return this.responseWrapper(response);
        } catch (error) {
            throw this.errorWrapper(error);
        }
    }
}