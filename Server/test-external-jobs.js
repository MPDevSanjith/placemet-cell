const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data for external job
const testJob = {
  companyName: 'Google',
  jobTitle: 'Software Engineer',
  description: 'Build scalable systems and applications',
  location: 'Mountain View, CA',
  jobType: 'Full-time',
  externalUrl: 'https://careers.google.com/jobs/software-engineer',
  salary: {
    min: 150000,
    max: 200000,
    currency: 'USD'
  },
  requirements: {
    experience: { min: 2, max: 5 },
    skills: ['JavaScript', 'Python', 'React', 'Node.js'],
    education: 'Bachelor\'s degree in Computer Science or related field'
  },
  tags: ['Software Engineering', 'Full-stack', 'Google'],
  applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
};

// Helper function to log responses
const logResponse = (title, response) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📋 ${title}`);
  console.log(`${'='.repeat(50)}`);
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(response.data, null, 2));
};

// Helper function to log errors
const logError = (title, error) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`❌ ${title}`);
  console.log(`${'='.repeat(50)}`);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.log('Error:', error.message);
  }
};

// Test 1: Get all external jobs (public endpoint)
const testGetAllJobs = async () => {
  try {
    console.log('\n🧪 Testing: Get all external jobs');
    const response = await axios.get(`${BASE_URL}/external-jobs`);
    logResponse('✅ Get all external jobs successful', response);
  } catch (error) {
    logError('❌ Get all external jobs failed', error);
  }
};

// Test 2: Get external jobs with filters
const testGetJobsWithFilters = async () => {
  try {
    console.log('\n🧪 Testing: Get external jobs with filters');
    const response = await axios.get(`${BASE_URL}/external-jobs?status=Active&jobType=Full-time&limit=5`);
    logResponse('✅ Get external jobs with filters successful', response);
  } catch (error) {
    logError('❌ Get external jobs with filters failed', error);
  }
};

// Test 3: Search external jobs
const testSearchJobs = async () => {
  try {
    console.log('\n🧪 Testing: Search external jobs');
    const response = await axios.get(`${BASE_URL}/external-jobs?search=Software`);
    logResponse('✅ Search external jobs successful', response);
  } catch (error) {
    logError('❌ Search external jobs failed', error);
  }
};

// Test 4: Get external job statistics
const testGetStats = async () => {
  try {
    console.log('\n🧪 Testing: Get external job statistics');
    const response = await axios.get(`${BASE_URL}/external-jobs/stats/overview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResponse('✅ Get external job statistics successful', response);
  } catch (error) {
    logError('❌ Get external job statistics failed', error);
  }
};

// Test 5: Create external job (requires authentication)
const testCreateJob = async () => {
  try {
    console.log('\n🧪 Testing: Create external job');
    const response = await axios.post(`${BASE_URL}/external-jobs`, testJob, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}` 
      }
    });
    logResponse('✅ Create external job successful', response);
    return response.data.data._id; // Return the created job ID for further tests
  } catch (error) {
    logError('❌ Create external job failed', error);
    return null;
  }
};

// Test 6: Get external job by ID
const testGetJobById = async (jobId) => {
  if (!jobId) return;
  
  try {
    console.log('\n🧪 Testing: Get external job by ID');
    const response = await axios.get(`${BASE_URL}/external-jobs/${jobId}`);
    logResponse('✅ Get external job by ID successful', response);
  } catch (error) {
    logError('❌ Get external job by ID failed', error);
  }
};

// Test 7: Update external job
const testUpdateJob = async (jobId) => {
  if (!jobId) return;
  
  try {
    console.log('\n🧪 Testing: Update external job');
    const updateData = {
      description: 'Updated: Build scalable systems and applications with modern technologies',
      salary: {
        min: 160000,
        max: 220000,
        currency: 'USD'
      }
    };
    
    const response = await axios.put(`${BASE_URL}/external-jobs/${jobId}`, updateData, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}` 
      }
    });
    logResponse('✅ Update external job successful', response);
  } catch (error) {
    logError('❌ Update external job failed', error);
  }
};

// Test 8: Update job status
const testUpdateJobStatus = async (jobId) => {
  if (!jobId) return;
  
  try {
    console.log('\n🧪 Testing: Update job status');
    const response = await axios.patch(`${BASE_URL}/external-jobs/${jobId}/status`, 
      { status: 'Inactive' },
      {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}` 
        }
      }
    );
    logResponse('✅ Update job status successful', response);
  } catch (error) {
    logError('❌ Update job status failed', error);
  }
};

// Test 9: Delete external job
const testDeleteJob = async (jobId) => {
  if (!jobId) return;
  
  try {
    console.log('\n🧪 Testing: Delete external job');
    const response = await axios.delete(`${BASE_URL}/external-jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResponse('✅ Delete external job successful', response);
  } catch (error) {
    logError('❌ Delete external job failed', error);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting External Jobs API Tests');
  console.log('📝 Note: Some tests require authentication token');
  console.log('💡 Set authToken variable with a valid JWT token to test protected endpoints');
  
  // Public endpoints (no auth required)
  await testGetAllJobs();
  await testGetJobsWithFilters();
  await testSearchJobs();
  
  // Protected endpoints (auth required)
  if (authToken) {
    await testGetStats();
    const jobId = await testCreateJob();
    if (jobId) {
      await testGetJobById(jobId);
      await testUpdateJob(jobId);
      await testUpdateJobStatus(jobId);
      await testDeleteJob(jobId);
    }
  } else {
    console.log('\n⚠️  Skipping protected endpoint tests - no auth token provided');
    console.log('💡 To test protected endpoints, set authToken variable with a valid JWT token');
  }
  
  console.log('\n🎉 All tests completed!');
};

// Run tests
runTests().catch(console.error);
