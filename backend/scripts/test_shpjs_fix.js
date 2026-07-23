if (typeof self === 'undefined') {
  global.self = global;
}

try {
  const shp = require('shpjs');
  console.log('✅ shpjs loaded successfully with global.self polyfill!');
  process.exit(0);
} catch (err) {
  console.error('❌ shpjs load error:', err);
  process.exit(1);
}
