const http = require('http');

const test = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:5002${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });
};

async function run() {
  const tablesRes = await test('/api/admin/tables');
  console.log("GET /api/admin/tables response:", tablesRes);

  if (Array.isArray(tablesRes.data) && tablesRes.data.length > 0) {
    const firstTable = tablesRes.data[0];
    console.log(`Testing GET /api/admin/tables/${firstTable}...`);
    const dataRes = await test(`/api/admin/tables/${firstTable}`);
    console.log(`GET /api/admin/tables/${firstTable} response status:`, dataRes.status);
    console.log(`Result type:`, typeof dataRes.data, Array.isArray(dataRes.data) ? `Array of ${dataRes.data.length}` : dataRes.data);
  }
}

run();
