const axios = require('axios');

async function testApi() {
    try {
        console.log('1. Testing Login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@admin.com',
            password: 'admin123'
        });

        console.log('Login Success! Status:', loginRes.status);
        const token = loginRes.data.token;
        if (!token) throw new Error('No token received');
        console.log('Token received.');

        console.log('2. Testing Get Facilities...');
        const facilitiesRes = await axios.get('http://localhost:5000/api/facilities', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Get Facilities Success! Status:', facilitiesRes.status);
        console.log('Facilities count:', facilitiesRes.data.length);
        if (facilitiesRes.data.length > 0) {
            console.log('Sample Facility:', facilitiesRes.data[0].name);
        }

    } catch (err) {
        console.error('API Test Failed:', err.response ? err.response.data : err.message);
    }
}

testApi();
