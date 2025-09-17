// Test OTP functionality
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testOtpRequest() {
  try {
    console.log('🧪 Testing OTP request...');
    
    const response = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ OTP request successful');
    } else {
      console.log('❌ OTP request failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOtpRequest();