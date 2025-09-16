/**
 * API Client Module for LocumTrueRate
 * 
 * Centralized API client for all backend communication.
 * Handles authentication, request/response interceptors, and all API endpoints.
 */

class ApiClient {
    constructor() {
        // Determine API URL based on environment with enhanced production support
        this.baseURL = this.getApiBaseUrl();
        
        // Initialize request headers
        this.headers = {
            'Content-Type': 'application/json'
        };

        // Load existing token if available
        const existingToken = localStorage.getItem('authToken');
        if (existingToken) {
            this.headers['Authorization'] = `Bearer ${existingToken}`;
        }
    }

    /**
     * Determine the appropriate API base URL based on environment
     * @returns {string} API base URL
     */
    getApiBaseUrl() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;

        // Development environment (localhost)
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Check for custom API port in development
            const devApiPort = process?.env?.REACT_APP_API_PORT || '4000';
            return `http://localhost:${devApiPort}/api/v1`;
        }

        // Staging environment (Heroku staging)
        if (hostname.includes('locumtruerate-stage') || hostname.includes('staging')) {
            // Use same origin for staging with explicit API path
            return `${protocol}//${hostname}/api/v1`;
        }

        // Production environment detection
        if (hostname.includes('herokuapp.com')) {
            // Production Heroku app - should use same origin
            return `${protocol}//${hostname}/api/v1`;
        }

        // Custom production domain
        if (hostname.includes('locumtruerate.com') || hostname.includes('truerate.app')) {
            // Production domain with potential API subdomain
            return `${protocol}//api.${hostname}/v1`;
        }

        // IP-based deployment or unknown domain
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            // IP address - likely server deployment
            const apiPort = port ? ':8080' : ''; // Common API port
            return `${protocol}//${hostname}${apiPort}/api/v1`;
        }

        // Environment variable override (highest priority)
        if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
            return process.env.API_BASE_URL;
        }

        // Browser environment variable check
        if (window.ENV?.API_BASE_URL) {
            return window.ENV.API_BASE_URL;
        }

        // Default fallback - relative path (same origin)
        return '/api/v1';
    }


    /**
     * Get authentication token from localStorage
     * @returns {string|null} JWT token if exists
     */
    getToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        if (token) {
            localStorage.setItem('authToken', token);
            this.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    /**
     * Remove authentication token
     */
    removeToken() {
        localStorage.removeItem('authToken');
        delete this.headers['Authorization'];
    }

    /**
     * Generic request method
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Add auth token if exists
        const token = this.getToken();
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            // Handle non-OK responses
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: `HTTP error! status: ${response.status}`
                }));
                
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    this.removeToken();
                    // Redirect to login if not already there
                    if (!window.location.pathname.includes('locum-dashboard')) {
                        window.location.href = '/frontend/locum-dashboard.html';
                    }
                }
                
                throw {
                    status: response.status,
                    data: errorData
                };
            }

            // Parse JSON response
            const data = await response.json();
            return data;
        } catch (error) {
            // Re-throw structured errors
            if (error.status && error.data) {
                throw error;
            }
            
            // Handle network errors
            throw {
                status: 0,
                data: { message: 'Network error. Please check your connection.' }
            };
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     * @returns {Promise} Response data
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(fullEndpoint, {
            method: 'GET'
        });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise} Response data
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise} Response data
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Response data
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Authentication Methods
    /**
     * Register a new user
     * @param {object} userData - User registration data
     * @returns {Promise} Response with user data and token
     */
    async register(userData) {
        const response = await this.post('/auth/register', userData);
        
        // Store token if registration successful
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    /**
     * Login user
     * @param {object} credentials - Login credentials
     * @returns {Promise} Response with user data and token
     */
    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        
        // Store token if login successful
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    /**
     * Logout user
     * @returns {Promise} Response
     */
    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            // Continue with logout even if API call fails
            console.error('Logout API error:', error);
        }
        
        // Always clear local session
        this.removeToken();
        
        return { message: 'Logged out successfully' };
    }

    /**
     * Get current user profile
     * @returns {Promise} User profile data
     */
    async getCurrentUser() {
        return this.get('/auth/me');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    // Job Methods
    /**
     * Get jobs with optional filters
     * @param {object} filters - Filter parameters
     * @returns {Promise} Jobs list
     */
    async getJobs(filters = {}) {
        return this.get('/jobs', filters);
    }

    /**
     * Get single job by ID
     * @param {string} jobId - Job ID
     * @returns {Promise} Job details
     */
    async getJob(jobId) {
        return this.get(`/jobs/${jobId}`);
    }

    /**
     * Create a new job posting (recruiter only)
     * @param {object} jobData - Job posting data
     * @returns {Promise} Created job
     */
    async createJob(jobData) {
        return this.post('/jobs', jobData);
    }

    /**
     * Update job posting (recruiter only)
     * @param {string} jobId - Job ID
     * @param {object} updates - Job updates
     * @returns {Promise} Updated job
     */
    async updateJob(jobId, updates) {
        return this.put(`/jobs/${jobId}`, updates);
    }

    /**
     * Delete job posting (recruiter only)
     * @param {string} jobId - Job ID
     * @returns {Promise} Deletion result
     */
    async deleteJob(jobId) {
        return this.delete(`/jobs/${jobId}`);
    }

    /**
     * Get jobs posted by current recruiter
     * @returns {Promise} Recruiter's jobs
     */
    async getMyPostedJobs() {
        return this.get('/jobs/my-posts');
    }

    // Application Methods
    /**
     * Apply to a job
     * @param {string} jobId - Job ID to apply to
     * @param {object} applicationData - Application data
     * @returns {Promise} Application result
     */
    async applyToJob(jobId, applicationData) {
        return this.post(`/jobs/${jobId}/apply`, applicationData);
    }

    /**
     * Get current user's applications
     * @param {object} filters - Optional filters
     * @returns {Promise} User's applications
     */
    async getMyApplications(filters = {}) {
        return this.get('/applications/my', filters);
    }

    /**
     * Get single application by ID
     * @param {string} applicationId - Application ID
     * @returns {Promise} Application details
     */
    async getApplication(applicationId) {
        return this.get(`/applications/${applicationId}`);
    }

    /**
     * Update application status (recruiter only)
     * @param {string} applicationId - Application ID
     * @param {object} statusUpdate - Status update data
     * @returns {Promise} Updated application
     */
    async updateApplicationStatus(applicationId, statusUpdate) {
        return this.put(`/applications/${applicationId}/status`, statusUpdate);
    }

    /**
     * Get applications for a specific job (recruiter only)
     * @param {string} jobId - Job ID
     * @returns {Promise} Applications for the job
     */
    async getJobApplications(jobId) {
        return this.get(`/jobs/${jobId}/applications`);
    }

    // Calculator Methods
    /**
     * Calculate contract details
     * @param {object} contractData - Contract parameters
     * @returns {Promise} Calculated contract details
     */
    async calculateContract(contractData) {
        return this.post('/calculators/contract', contractData);
    }

    /**
     * Calculate paycheck details
     * @param {object} paycheckData - Paycheck parameters
     * @returns {Promise} Calculated paycheck details
     */
    async calculatePaycheck(paycheckData) {
        return this.post('/calculators/paycheck', paycheckData);
    }

    /**
     * Save calculation for logged-in user
     * @param {object} calculationData - Calculation data to save
     * @returns {Promise} Save result
     */
    async saveCalculation(calculationData) {
        return this.post('/calculators/save', calculationData);
    }

    /**
     * Get saved calculations for logged-in user
     * @param {object} filters - Optional filters
     * @returns {Promise} User's saved calculations
     */
    async getSavedCalculations(filters = {}) {
        return this.get('/calculators/saved', filters);
    }

    /**
     * Save contract calculation
     * @param {object} calculationData - Calculation data to save
     * @returns {Promise} Saved calculation
     */
    async saveContractCalculation(calculationData) {
        return this.post('/calculations/contract', calculationData);
    }

    /**
     * Save paycheck calculation
     * @param {object} calculationData - Calculation data to save
     * @returns {Promise} Saved calculation
     */
    async savePaycheckCalculation(calculationData) {
        return this.post('/calculations/paycheck', calculationData);
    }

    /**
     * Get user's saved calculations
     * @param {string} type - Calculation type ('contract' or 'paycheck')
     * @returns {Promise} User's calculations
     */
    async getMySavedCalculations(type) {
        return this.get(`/calculations/my/${type}`);
    }
}

// Create singleton instance
window.apiClient = new ApiClient();