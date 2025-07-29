const axios = require('axios');

const API_URL = 'https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1';

async function testApplicationCreation() {
    try {
        // Login first
        console.log('Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'debug_1753755012@example.com',
            password: 'TestPass123!'
        });

        const token = loginResponse.data.token;
        console.log('Token obtained');

        // Try to create application
        console.log('\nCreating application...');
        const appResponse = await axios.post(`${API_URL}/applications`, {
            job_id: 1,
            applicant_name: 'Test User',
            applicant_email: 'test@example.com',
            privacy_policy_accepted: true,
            terms_accepted: true
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Application created:', appResponse.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        if (error.response?.data) {
            console.log('\nFull error response:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }
    }
}

testApplicationCreation();