// Test authentication flow across servers
const testEmail = `test.flow.${Date.now()}@example.com`;
const testPassword = 'TestFlow123';

async function testFullAuthFlow() {
    console.log('🔐 Testing Full Authentication Flow Across Servers');
    console.log('='.repeat(50));
    
    const api = new ApiClient('http://localhost:4000/api/v1');
    
    try {
        // 1. Register
        console.log('1. Registering user...');
        const registerResult = await api.register({
            email: testEmail,
            password: testPassword,
            firstName: 'Test',
            lastName: 'Flow',
            role: 'locum'
        });
        console.log('✅ Registration successful');
        
        // 2. Login
        console.log('2. Logging in...');
        const loginResult = await api.login(testEmail, testPassword);
        console.log('✅ Login successful, token received');
        console.log(`   Token: ${loginResult.token.substring(0, 20)}...`);
        
        // 3. Test authenticated endpoint
        console.log('3. Testing authenticated endpoint...');
        const userResult = await api.getCurrentUser();
        console.log('✅ Authenticated request successful');
        console.log(`   User: ${userResult.user.email}`);
        
        // 4. Test localStorage integration
        console.log('4. Testing Auth helper...');
        Auth.login(loginResult.token, loginResult.user);
        console.log(`✅ Auth helper working, logged in as: ${Auth.getUserDisplayName()}`);
        
        // 5. Test applications endpoint
        console.log('5. Testing applications endpoint...');
        const appsResult = await api.getMyApplications();
        console.log(`✅ Applications endpoint working, found: ${appsResult.applications ? appsResult.applications.length : 0} applications`);
        
        // 6. Logout
        console.log('6. Logging out...');
        await api.logout();
        Auth.logout();
        console.log('✅ Logout successful');
        
        console.log('\n🎉 All authentication tests passed!');
        
    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
        return false;
    }
    
    return true;
}

// Run test if in browser
if (typeof window !== 'undefined') {
    console.log('Running authentication flow test...');
    testFullAuthFlow();
}