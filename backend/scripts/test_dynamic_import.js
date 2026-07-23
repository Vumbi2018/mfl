if (typeof self === 'undefined') {
  global.self = global;
}

async function testImport() {
  try {
    const shpModule = await import('shpjs');
    console.log('🔍 dynamic import shpModule keys:', Object.keys(shpModule));
    const shpFunc = shpModule.default || shpModule;
    console.log('🔍 shpFunc type:', typeof shpFunc);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error dynamic importing shpjs:', err);
    process.exit(1);
  }
}

testImport();
