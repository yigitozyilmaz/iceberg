export class ResponseWrapper {
    constructor(response, data = null) {
        this.data = data || response.data
        this.status = response.status
        this.statusText = response.statusText
        this.headers = response.headers
    }
}

export class ErrorWrapper extends Error {
    constructor(error) {
        super()
        this.success = false
        this.meta = error?.response?.data?.meta || {}
        this.code = error?.response?.status || 500
        this.status = error?.response?.statusText || 'Internal Server Error'
        this.message = error?.response?.data?.message || error.message || 'Something went wrong'
    }
}
