// Debug script to test all auth routes
import http from 'http';

const testEndpoints = [
  { path: '/api/auth/request-otp', method: 'POST', body: { email: 'test@example.com' } },
  { path: '/health', method: 'GET' },
  { path: '/api/auth/login', method: 'POST', body: { email: 'test@example.com', password: 'test' } }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const postData = endpoint.body ? JSON.stringify(endpoint.body) : '';
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🧪 Testing ${endpoint.method} ${endpoint.path}`);

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`   Response:`, response);
        } catch (error) {
          console.log(`   Raw response:`, data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`   ❌ Request failed:`, error.message);
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Testing server endpoints...');
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n✅ Tests completed');
}

runTests();