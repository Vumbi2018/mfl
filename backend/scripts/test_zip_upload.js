const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testZipUpload() {
  try {
    console.log('🔍 Testing POST /api/spatial/upload-shapefile with a GeoJSON file uploaded as shapefile...');

    const sampleGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            NAME: "Test Lusaka Ward 11",
            CODE: "LUS_W11",
            population: 18200
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [[28.29, -15.42], [28.30, -15.42], [28.30, -15.43], [28.29, -15.43], [28.29, -15.42]]
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

testZipUpload();
