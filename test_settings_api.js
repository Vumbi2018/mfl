const http = require('http');

http.get('http://localhost:5002/api/settings', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("GET /api/settings Status:", res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log("Response Keys:", Object.keys(parsed));
      console.log("Full Response:", JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log("Raw Response:", data);
    }
  });
}).on('error', err => console.error("API Error:", err));
