const http = require('http');

http.get('http://localhost:5002/api/spatial/capitals', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("GET /api/spatial/capitals Status:", res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log("Success:", parsed.success);
      console.log("Total Capitals:", parsed.count);
      console.log("Provincial HQ Count:", parsed.provincial_hq_count);
      console.log("District HQ Count:", parsed.district_hq_count);
      console.log("Sample Record:", parsed.data[0]);
    } catch (e) {
      console.log("Raw Response:", data);
    }
  });
}).on('error', err => console.error("API Error:", err));
