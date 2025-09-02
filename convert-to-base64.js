const fs = require('fs');

// Read the service account JSON file
const jsonContent = fs.readFileSync('placement-erp-e82306c93030.json', 'utf8');

// Convert to base64
const base64String = Buffer.from(jsonContent).toString('base64');

console.log('Base64 encoded service account credentials:');
console.log(base64String);

// Also save to a file for easy copying
fs.writeFileSync('base64-credentials.txt', base64String);
console.log('\nBase64 credentials saved to base64-credentials.txt');
