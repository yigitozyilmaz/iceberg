import axios from 'axios'
import { ResponseWrapper, ErrorWrapper } from './util'

export class BaseService {
    static get entity() {
        throw new Error('entity getter not defined')
    }

    static get request() {
        return axios.create({
            baseURL: import.meta.env.VITE_AIRTABLE_API_URL,
            headers: {
                "Authorization": `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
            }
        })
    }

    static responseWrapper(response) {
        if (response.data.records) {
            return new ResponseWrapper(response, response.data.records.map(record => ({
                id: record.id,
                ...record.fields
            })))
        }
        return new ResponseWrapper(response, response.data)
    }

    static errorWrapper(error) {
        return new ErrorWrapper(error)
    }

    static async get(params = {}) {
        try {
            const response = await this.request.get(`/${this.entity}`, { params })
            return this.responseWrapper(response)
        } catch (error) {
            throw this.errorWrapper(error)
        }
    }

    static async getById(id) {
        try {
            const response = await this.request.get(`/${this.entity}/${id}`)
            return this.responseWrapper(response)
        } catch (error) {
            throw this.errorWrapper(error)
        }
    }

    static async create(data) {
        try {
            const response = await this.request.post(`/${this.entity}`, {
                records: [{ fields: data }]
            })
            return this.responseWrapper(response)
        } catch (error) {
            throw this.errorWrapper(error)
        }
    }

    static async update(id, data) {
        try {
            const response = await this.request.patch(`/${this.entity}`, {
                records: [{ id, fields: data }]
            })
            return this.responseWrapper(response)
        } catch (error) {
            throw this.errorWrapper(error)
        }
    }
}
