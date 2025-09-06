// Simple test script to verify profile API endpoints
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

// Test endpoints (without authentication for now)
const testEndpoints = [
  '/profile/comprehensive',
  '/profile/completion',
  '/profile/skills',
  '/profile/projects'
];

console.log('🧪 Testing Profile API Endpoints...\n');

testEndpoints.forEach(async (endpoint) => {
  try {
    console.log(`Testing: ${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists (authentication required)');
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found');
    } else {
      console.log('✅ Endpoint accessible');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
});

console.log('Test completed. Check if server is running on port 5000.');
