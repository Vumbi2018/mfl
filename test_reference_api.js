const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:5002${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ path, status: res.statusCode, count: Array.isArray(parsed) ? parsed.length : (parsed.data ? parsed.data.length : 'Object'), sample: parsed });
        } catch (e) {
          resolve({ path, status: res.statusCode, error: data.substring(0, 150) });
        }
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
};

async function run() {
  const endpoints = [
    '/api/facilities/types',
    '/api/facilities/locations',
    '/api/reference/facility-types',
    '/api/reference/service-types',
    '/api/reference/service-categories',
    '/api/reference/verification-methods',
    '/api/reference/workflow-states',
    '/api/reference/data-dictionary',
    '/api/admin/tables'
  ];

  for (const ep of endpoints) {
    const res = await testEndpoint(ep);
    console.log(`Endpoint: ${ep} => Status: ${res.status}, Count: ${res.count}`);
    if (res.error) console.log(`   Error: ${res.error}`);
  }
}

run();
