const XLSX = require('xlsx');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../../Zambian Health Facilities.xlsx');

function inspectXLSX() {
    try {
        const workbook = XLSX.readFile(FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Try standard JSON conversion
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log('Total Rows:', data.length);
        if (data.length > 0) {
            console.log('First Row Keys:', Object.keys(data[0]));
            console.log('First Row Data:', data[0]);
        }
    } catch (err) {
        console.error('Error reading XLSX:', err.message);
    }
}

inspectXLSX();
