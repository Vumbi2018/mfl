const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testExternalEndpoints() {
    console.log('🧪 Testing External API Endpoints...\n');

    try {
        // 1. Test Facilities List
        console.log('1. Fetching Public Facilities List...');
        const facilitiesRes = await axios.get(`${BASE_URL}/facilities/public`);
        console.log(`   ✅ Success! Retrieved ${facilitiesRes.data.length} facilities.`);
        if (facilitiesRes.data.length > 0) {
            const sample = facilitiesRes.data[0];
            console.log('   🔍 Sample Data:', {
                id: sample.id,
                name: sample.name,
                type: sample.type,
                region: sample.region,
                coords: [sample.latitude, sample.longitude]
            });
        }
    } catch (err) {
        console.error('   ❌ Failed to fetch facilities:', err.message);
    }

    try {
        console.log('\n2. Fetching Location Hierarchy...');
        const locRes = await axios.get(`${BASE_URL}/facilities/locations`);
        console.log(`   ✅ Success! Retrieved ${locRes.data.length} regions.`);
    } catch (err) {
        console.error('   ❌ Failed to fetch locations:', err.message);
    }

    try {
        console.log('\n3. Fetching Facility Types...');
        const typeRes = await axios.get(`${BASE_URL}/facilities/types`);
        console.log(`   ✅ Success! Retrieved ${typeRes.data.length} facility types.`);
        console.log(`   📋 Types: ${typeRes.data.slice(0, 5).join(', ')}...`);
    } catch (err) {
        console.error('   ❌ Failed to fetch types:', err.message);
    }
}

testExternalEndpoints();
