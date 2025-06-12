// API Service for backend communication

export class APIService {
    constructor(baseURL = null) {
        this.baseURL = baseURL || this.getBaseURL();
        this.authToken = null;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    getBaseURL() {
        // Determine base URL based on environment
        if (process.env.NODE_ENV === 'production') {
            return window.location.origin + '/api';
        } else {
            return 'http://localhost:5000/api';
        }
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    clearAuthToken() {
        this.authToken = null;
    }

    getHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        return headers;
    }

    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getHeaders(options.headers);
        
        const config = {
            method: method.toUpperCase(),
            headers,
            ...options
        };

        // Add body for POST, PUT, PATCH requests
        if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
            if (data instanceof FormData) {
                // Remove Content-Type header for FormData (browser will set it)
                delete config.headers['Content-Type'];
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }

        try {
            const response = await fetch(url, config);
            return await this.handleResponse(response);
        } catch (error) {
            console.error(`API request failed: ${method} ${endpoint}`, error);
            throw this.handleError(error);
        }
    }

    async handleResponse(response) {
        let data;
        
        // Check if response has content
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const error = new Error(data.message || data.error || `HTTP ${response.status}`);
            error.status = response.status;
            error.response = data;
            throw error;
        }

        return {
            success: true,
            data: data,
            status: response.status,
            headers: response.headers
        };
    }

    handleError(error) {
        if (error.status === 401) {
            // Unauthorized - token might be expired
            this.clearAuthToken();
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        } else if (error.status === 403) {
            // Forbidden - insufficient permissions
            window.dispatchEvent(new CustomEvent('auth:forbidden'));
        } else if (error.status >= 500) {
            // Server error
            window.dispatchEvent(new CustomEvent('api:server-error', { detail: error }));
        }

        return {
            success: false,
            error: error.message || 'An error occurred',
            status: error.status,
            response: error.response
        };
    }

    // HTTP methods
    async get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    async post(endpoint, data = null, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data = null, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    async patch(endpoint, data = null, options = {}) {
        return this.request('PATCH', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    // Specialized methods for common patterns
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional data to form
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        return this.post(endpoint, formData);
    }

    async downloadFile(endpoint, filename = null) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('File download failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility methods for common API patterns
    buildQueryString(params) {
        const query = new URLSearchParams();
        
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(item => query.append(key, item));
                } else {
                    query.append(key, value);
                }
            }
        });
        
        return query.toString();
    }

    async getPaginated(endpoint, params = {}) {
        const queryString = this.buildQueryString(params);
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.get(url);
    }

    // Batch operations
    async batch(requests) {
        const promises = requests.map(req => 
            this.request(req.method, req.endpoint, req.data, req.options)
                .catch(error => ({ success: false, error, request: req }))
        );

        const results = await Promise.all(promises);
        
        return {
            success: results.every(result => result.success),
            results,
            successCount: results.filter(result => result.success).length,
            errorCount: results.filter(result => !result.success).length
        };
    }

    // Request cancellation support
    createCancelToken() {
        const controller = new AbortController();
        
        return {
            token: controller.signal,
            cancel: (reason) => controller.abort(reason)
        };
    }

    async requestWithCancel(method, endpoint, data = null, cancelToken = null) {
        const options = cancelToken ? { signal: cancelToken } : {};
        return this.request(method, endpoint, data, options);
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.get('/health');
            return response.success;
        } catch (error) {
            return false;
        }
    }

    // Debug methods
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[APIService] ${message}`, data || '');
        }
    }
}