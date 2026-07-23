const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadShapefile() {
  try {
    console.log('🔍 Testing POST /api/spatial/upload-shapefile with GeoJSON file...');

    const sampleGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            NAME: "Test Lusaka Ward 10",
            CODE: "LUS_W10",
            population: 15400
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [[28.28, -15.41], [28.29, -15.41], [28.29, -15.42], [28.28, -15.42], [28.28, -15.41]]
            ]
          }
        }
      ]
    };

    const tempFilePath = path.join(__dirname, 'temp_ward_sample.json');
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

    console.log('✅ Upload API Response HTTP', res.status, ':', res.data);

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error testing shapefile upload:', err.response?.status, err.response?.data || err.message || err);
    process.exit(1);
  }
}

testUploadShapefile();
