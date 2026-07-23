if (typeof self === 'undefined') {
  global.self = global;
}

const shpModule = require('shpjs');

console.log('🔍 shpModule type:', typeof shpModule);
console.log('🔍 shpModule keys:', Object.keys(shpModule));
console.log('🔍 shpModule.parseZip type:', typeof shpModule.parseZip);
console.log('🔍 shpModule.parseShp type:', typeof shpModule.parseShp);
console.log('🔍 shpModule.default type:', typeof shpModule.default);
console.log('🔍 shpModule is function?:', typeof shpModule === 'function');
