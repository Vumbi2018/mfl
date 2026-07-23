const axios = require('axios');

async function testApi() {
    try {
        // Assuming we need a token? 
        // The previous server.js showed: app.get('/api/users', verifyToken, userController.getUsers);
        // We probably don't have a valid token handy for this script unless we login first.
        // But let's try to bypass or login.

        console.log("Attempting login...");
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'admin@system.com', // Guessing default admin?
            password: 'password'
        });

        const token = loginRes.data.token;
        console.log("Got token. Fetching users...");

        const usersRes = await axios.get('http://localhost:5001/api/users', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Users API Status:", usersRes.status);
        console.log("Users API Data:", JSON.stringify(usersRes.data, null, 2));

    } catch (err) {
        console.error("API Error:", err.message);
        if (err.response) {
            console.error("Response Status:", err.response.status);
            console.error("Response Data:", err.response.data);
        }
    }
}

testApi();
