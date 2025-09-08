// Mock API functions for development and testing
// These functions simulate backend API calls for authentication and status checks

export interface StudentStatusResponse {
  isLoggedIn: boolean
  hasUploadedResume: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface PlacementStatusResponse {
  isLoggedIn: boolean
  hasCompletedSetup: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

// Mock function to check student status
export async function mockStudentStatus(token: string): Promise<StudentStatusResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // For development, we'll simulate different scenarios based on token
  if (!token) {
    return {
      isLoggedIn: false,
      hasUploadedResume: false
    }
  }

  // Mock user data - in real implementation, this would come from backend
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'student'
  }

  // Simulate different states for testing
  // You can modify these conditions to test different scenarios
  const hasResume = Math.random() > 0.3 // 70% chance of having resume
  
  return {
    isLoggedIn: true,
    hasUploadedResume: hasResume,
    user: mockUser
  }
}

// Mock function to check placement officer status
export async function mockPlacementStatus(token: string): Promise<PlacementStatusResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // For development, we'll simulate different scenarios based on token
  if (!token) {
    return {
      isLoggedIn: false,
      hasCompletedSetup: false
    }
  }

  // Mock user data - in real implementation, this would come from backend
  const mockUser = {
    id: '1',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'placement_officer'
  }

  // Simulate different states for testing
  // You can modify these conditions to test different scenarios
  const hasSetup = Math.random() > 0.2 // 80% chance of having completed setup
  
  return {
    isLoggedIn: true,
    hasCompletedSetup: hasSetup,
    user: mockUser
  }
}

// Mock function for general API calls (can be extended as needed)
export async function mockApiCall<T>(endpoint: string, token?: string): Promise<T> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock response based on endpoint
  switch (endpoint) {
    case '/api/student/profile':
      return {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'student',
        hasResume: true
      } as T
    
    case '/api/placement-officer/profile':
      return {
        id: '1',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'placement_officer',
        hasCompletedSetup: true
      } as T
    
    default:
      throw new Error(`Mock API endpoint not found: ${endpoint}`)
  }
}

// Helper function to simulate network errors (for testing error handling)
export async function mockApiCallWithError(endpoint: string, shouldError: boolean = false): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (shouldError) {
    throw new Error('Mock API error: Network request failed')
  }
  
  return { success: true, message: 'Mock API call successful' }
}
