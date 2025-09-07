// Simple test script to verify API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  // Test health check
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test companies requests endpoint
  try {
    const companiesResponse = await fetch(`${BASE_URL}/api/companies/requests`);
    const companiesData = await companiesResponse.json();
    console.log('✅ Companies requests GET:', companiesResponse.status, companiesData);
  } catch (error) {
    console.log('❌ Companies requests GET failed:', error.message);
  }

  // Test jobs endpoint
  try {
    const jobsResponse = await fetch(`${BASE_URL}/api/jobs?limit=10`);
    const jobsData = await jobsResponse.json();
    console.log('✅ Jobs GET:', jobsResponse.status, jobsData);
  } catch (error) {
    console.log('❌ Jobs GET failed:', error.message);
  }

  // Test external jobs endpoint
  try {
    const externalJobsResponse = await fetch(`${BASE_URL}/api/external-jobs?status=Active&limit=10`);
    const externalJobsData = await externalJobsResponse.json();
    console.log('✅ External jobs GET:', externalJobsResponse.status, externalJobsData);
  } catch (error) {
    console.log('❌ External jobs GET failed:', error.message);
  }

  // Test creating a company request
  try {
    const createRequestResponse = await fetch(`${BASE_URL}/api/companies/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company: 'Test Company',
        jobRole: 'Software Engineer',
        description: 'Test job description',
        studentsRequired: 5,
        minimumCGPA: 7.0
      })
    });
    const createRequestData = await createRequestResponse.json();
    console.log('✅ Create company request:', createRequestResponse.status, createRequestData);
  } catch (error) {
    console.log('❌ Create company request failed:', error.message);
  }
}

testAPI().catch(console.error);
