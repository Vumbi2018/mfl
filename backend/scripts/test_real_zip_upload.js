const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

async function testRealZipUpload() {
  try {
    console.log('🔍 Testing POST /api/spatial/upload-shapefile with a GeoJSON file...');

    const sampleGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            NAME: "Lusaka Central Ward 12",
            CODE: "LUS_W12",
            population: 24500
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [[28.28, -15.40], [28.31, -15.40], [28.31, -15.43], [28.28, -15.43], [28.28, -15.40]]
            ]
          }
        }
      ]
    };

    const tempFilePath = path.join(__dirname, 'admin4_sample.geojson');
    fs.writeFileSync(tempFilePath, JSON.stringify(sampleGeoJson));

    const formData = new FormData();
    formData.append('shapefile', fs.createReadStream(tempFilePath));
    formData.append('target_level', '4');

    const res = await axios.post('http://localhost:5002/api/spatial/upload-shapefile', formData, {
      headers: {
        ...formData.getHeaders(),
        'x-tenant-code': 'zambia'
      }
    });

    console.log('✅ Upload Endpoint Response HTTP', res.status, ':', res.data);

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during test:', err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }
}

testRealZipUpload();
