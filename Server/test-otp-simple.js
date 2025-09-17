// Simple OTP test using built-in modules
import http from 'http';

const postData = JSON.stringify({
  email: 'test@example.com'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/request-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing OTP request...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response:', response);
      
      if (res.statusCode === 200) {
        console.log('✅ OTP request successful');
      } else {
        console.log('❌ OTP request failed');
      }
    } catch (error) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();