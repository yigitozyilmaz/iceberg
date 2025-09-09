export class ResponseWrapper {
    constructor(response, data = null) {
        this.success = true;
        this.data = data || response.data;
        this.status = response.status;
        this.statusText = response.statusText;
        this.headers = response.headers;
    }
}

export class ErrorWrapper extends Error {
    constructor(error) {
        super(error.message);
        this.success = false;
        this.data = null;
        this.status = error.response?.status || 500;
        this.statusText = error.response?.statusText || 'Internal Server Error';

        // Airtable specific error handling
        if (error.response?.data?.error) {
            this.message = error.response.data.error.message;
            this.type = error.response.data.error.type;
        }

        // Network or other errors
        if (!error.response) {
            this.message = error.message || 'Network Error';
            this.type = 'NetworkError';
        }
    }
}