/**
 * API Client for LocumTrueRate
 * Handles all API communication with proper error handling and authentication
 */

class ApiClient {
    constructor(baseUrl = 'http://localhost:4000/api/v1') {
        this.baseUrl = baseUrl;
        this.authToken = null;
    }

    /**
     * Set the authentication token
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        this.authToken = token;
    }

    /**
     * Clear the authentication token
     */
    clearAuthToken() {
        this.authToken = null;
    }

    /**
     * Base request method with error handling
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - API response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add auth token if available
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        // Prepare request options
        const requestOptions = {
            ...options,
            headers
        };

        // Convert body to JSON if it's an object
        if (options.body && typeof options.body === 'object') {
            requestOptions.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();

            // Handle successful responses
            if (response.ok) {
                return data;
            }

            // Handle specific error cases
            if (response.status === 401) {
                // Token expired or invalid
                this.clearAuthToken();
                throw new ApiError('Authentication failed. Please login again.', 401, data);
            }

            // Handle other errors
            throw new ApiError(
                data.message || `Request failed with status ${response.status}`,
                response.status,
                data
            );

        } catch (error) {
            // Handle network errors
            if (error instanceof ApiError) {
                throw error;
            }
            
            if (error.message === 'Failed to fetch') {
                throw new ApiError(
                    'Unable to connect to server. Please check your internet connection.',
                    0,
                    null
                );
            }

            throw new ApiError(
                error.message || 'An unexpected error occurred',
                0,
                null
            );
        }
    }

    /**
     * GET request helper
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} - API response
     */
    async get(endpoint, params = {}) {
        // Build query string
        const queryString = new URLSearchParams(params).toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(fullEndpoint, {
            method: 'GET'
        });
    }

    /**
     * POST request helper
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @returns {Promise<Object>} - API response
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    /**
     * PUT request helper
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @returns {Promise<Object>} - API response
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * DELETE request helper
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} - API response
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ============= Authentication Methods =============
    
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password
     * @param {string} userData.firstName - First name
     * @param {string} userData.lastName - Last name
     * @param {string} userData.phone - Phone number (optional)
     * @param {string} userData.role - User role (locum/recruiter)
     * @returns {Promise<Object>} - Registration response
     */
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        return response;
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - Login response with token and user info
     */
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        
        // Automatically set the auth token if login successful
        if (response.token) {
            this.setAuthToken(response.token);
        }
        
        return response;
    }

    /**
     * Logout current user
     * @returns {Promise<Object>} - Logout response
     */
    async logout() {
        try {
            const response = await this.post('/auth/logout');
            this.clearAuthToken();
            return response;
        } catch (error) {
            // Clear token even if logout fails
            this.clearAuthToken();
            throw error;
        }
    }

    /**
     * Get current user info
     * @returns {Promise<Object>} - Current user data
     */
    async getCurrentUser() {
        return this.get('/auth/me');
    }

    // ============= Job Methods =============
    
    /**
     * Get list of jobs with optional filters
     * @param {Object} filters - Filter options
     * @param {number} filters.page - Page number (default: 1)
     * @param {number} filters.limit - Items per page (default: 20)
     * @param {string} filters.state - Filter by state
     * @param {string} filters.specialty - Filter by specialty
     * @param {number} filters.minRate - Minimum hourly rate
     * @param {number} filters.maxRate - Maximum hourly rate
     * @param {string} filters.search - Search term
     * @param {string} filters.sortBy - Sort field
     * @param {string} filters.sortOrder - Sort order (ASC/DESC)
     * @returns {Promise<Object>} - Jobs list with pagination info
     */
    async getJobs(filters = {}) {
        return this.get('/jobs', filters);
    }

    /**
     * Get single job by ID
     * @param {number} id - Job ID
     * @returns {Promise<Object>} - Job details
     */
    async getJob(id) {
        return this.get(`/jobs/${id}`);
    }

    /**
     * Create a new job posting (requires authentication)
     * @param {Object} jobData - Job data
     * @param {string} jobData.title - Job title
     * @param {string} jobData.location - Job location
     * @param {string} jobData.state - State code
     * @param {number} jobData.hourlyRateMin - Minimum hourly rate
     * @param {number} jobData.hourlyRateMax - Maximum hourly rate
     * @param {string} jobData.specialty - Medical specialty
     * @param {string} jobData.description - Job description
     * @param {Array<string>} jobData.requirements - Job requirements
     * @param {Array<string>} jobData.benefits - Job benefits (optional)
     * @param {string} jobData.companyName - Company name
     * @returns {Promise<Object>} - Created job data
     */
    async createJob(jobData) {
        return this.post('/jobs', jobData);
    }

    /**
     * Update an existing job (requires authentication and ownership)
     * @param {number} id - Job ID
     * @param {Object} jobData - Updated job data (partial update supported)
     * @returns {Promise<Object>} - Updated job data
     */
    async updateJob(id, jobData) {
        return this.put(`/jobs/${id}`, jobData);
    }

    /**
     * Delete a job (requires authentication and ownership)
     * @param {number} id - Job ID
     * @returns {Promise<Object>} - Deletion response
     */
    async deleteJob(id) {
        return this.delete(`/jobs/${id}`);
    }

    // ============= Application Methods =============
    
    /**
     * Apply to a job (requires authentication)
     * @param {Object} applicationData - Application data
     * @param {number} applicationData.jobId - Job ID to apply for
     * @param {string} applicationData.coverLetter - Cover letter
     * @param {number} applicationData.expectedRate - Expected hourly rate
     * @param {string} applicationData.availableDate - Available start date (YYYY-MM-DD)
     * @param {string} applicationData.notes - Additional notes (optional)
     * @returns {Promise<Object>} - Application response
     */
    async applyToJob(applicationData) {
        return this.post('/applications', applicationData);
    }

    /**
     * Get current user's applications
     * @param {Object} options - Query options
     * @param {number} options.page - Page number
     * @param {number} options.limit - Items per page
     * @param {string} options.status - Filter by status (pending/reviewed/accepted/rejected/withdrawn)
     * @param {string} options.sortBy - Sort field
     * @param {string} options.sortOrder - Sort order
     * @returns {Promise<Object>} - User's applications with pagination
     */
    async getMyApplications(options = {}) {
        return this.get('/applications/my', options);
    }

    /**
     * Get applications for a specific job (recruiter only)
     * @param {number} jobId - Job ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Job applications
     */
    async getApplicationsForJob(jobId, options = {}) {
        return this.get(`/applications/for-job/${jobId}`, options);
    }

    /**
     * Search user's applications
     * @param {Object} searchOptions - Search parameters
     * @param {string} searchOptions.search - Search term
     * @param {string} searchOptions.status - Filter by status
     * @param {string} searchOptions.specialty - Filter by specialty
     * @param {string} searchOptions.state - Filter by state
     * @param {string} searchOptions.dateFrom - Start date filter
     * @param {string} searchOptions.dateTo - End date filter
     * @returns {Promise<Object>} - Search results
     */
    async searchMyApplications(searchOptions = {}) {
        return this.get('/applications/search', searchOptions);
    }

    /**
     * Search applications for a job (recruiter only)
     * @param {number} jobId - Job ID
     * @param {Object} searchOptions - Search parameters
     * @returns {Promise<Object>} - Search results
     */
    async searchJobApplications(jobId, searchOptions = {}) {
        return this.get(`/applications/for-job/${jobId}/search`, searchOptions);
    }

    /**
     * Get filter options for applications
     * @returns {Promise<Object>} - Available filter options
     */
    async getApplicationFilterOptions() {
        return this.get('/applications/filter-options');
    }

    /**
     * Update application status (recruiter only)
     * @param {number} id - Application ID
     * @param {Object} statusData - Status update data
     * @param {string} statusData.status - New status
     * @param {string} statusData.notes - Review notes (optional)
     * @returns {Promise<Object>} - Updated application
     */
    async updateApplicationStatus(id, statusData) {
        return this.put(`/applications/${id}/status`, statusData);
    }

    /**
     * Withdraw an application (applicant only)
     * @param {number} id - Application ID
     * @returns {Promise<Object>} - Withdrawal response
     */
    async withdrawApplication(id) {
        return this.delete(`/applications/${id}`);
    }

    // ============= Calculator Methods =============
    
    /**
     * Calculate contract earnings and taxes
     * @param {Object} contractData - Contract calculation data
     * @param {number} contractData.hourlyRate - Hourly rate
     * @param {number} contractData.hoursPerWeek - Hours per week
     * @param {number} contractData.weeksPerYear - Weeks per year
     * @param {string} contractData.state - State code for tax calculation
     * @param {number} contractData.expenseRate - Business expense rate (0-1, e.g., 0.15 for 15%)
     * @returns {Promise<Object>} - Detailed calculation results
     */
    async calculateContract(contractData) {
        return this.post('/calculate/contract', contractData);
    }

    /**
     * Calculate paycheck with deductions
     * @param {Object} paycheckData - Paycheck calculation data
     * @param {number} paycheckData.regularHours - Regular hours worked
     * @param {number} paycheckData.regularRate - Regular hourly rate
     * @param {number} paycheckData.overtimeHours - Overtime hours (optional)
     * @param {number} paycheckData.overtimeRate - Overtime hourly rate (optional)
     * @param {string} paycheckData.state - State code for tax calculation
     * @param {string} paycheckData.period - Pay period (weekly/biweekly/monthly)
     * @returns {Promise<Object>} - Detailed paycheck breakdown
     */
    async calculatePaycheck(paycheckData) {
        return this.post('/calculate/paycheck', paycheckData);
    }

    /**
     * Simple paycheck calculator
     * @param {Object} simplePaycheckData - Simple paycheck data
     * @param {number} simplePaycheckData.grossPay - Gross pay amount
     * @param {number} simplePaycheckData.additionalDeductions - Additional deductions (optional)
     * @param {string} simplePaycheckData.state - State code
     * @param {string} simplePaycheckData.period - Pay period
     * @returns {Promise<Object>} - Simple paycheck calculation
     */
    async calculateSimplePaycheck(simplePaycheckData) {
        return this.post('/calculate/simple-paycheck', simplePaycheckData);
    }

    /**
     * Get tax information (brackets and rates)
     * @returns {Promise<Object>} - Current tax information
     */
    async getTaxInfo() {
        return this.get('/calculate/tax-info');
    }

    /**
     * Get all US states with tax rates
     * @returns {Promise<Object>} - States list with tax rates
     */
    async getStates() {
        return this.get('/calculate/states');
    }

    // ============= GDPR Data Export Methods =============
    
    /**
     * Export user's data (GDPR compliance)
     * @param {Object} exportOptions - Export options
     * @param {string} exportOptions.format - Export format (json/csv)
     * @param {boolean} exportOptions.includeHistory - Include historical data
     * @param {string} exportOptions.dateFrom - Start date filter
     * @param {string} exportOptions.dateTo - End date filter
     * @returns {Promise<Object>} - Exported data
     */
    async exportMyData(exportOptions = {}) {
        return this.get('/data-export/my-data', exportOptions);
    }

    /**
     * Get privacy summary
     * @returns {Promise<Object>} - Privacy policy and data processing info
     */
    async getPrivacySummary() {
        return this.get('/data-export/privacy-summary');
    }

    /**
     * Get data deletion request information
     * @returns {Promise<Object>} - Data deletion process info
     */
    async getDataDeletionInfo() {
        return this.get('/data-export/request-deletion');
    }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(message, statusCode, data) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.data = data;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, ApiError };
}