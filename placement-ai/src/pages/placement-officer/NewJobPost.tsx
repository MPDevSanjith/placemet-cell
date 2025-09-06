import React, { useState, useEffect } from 'react';
import { createExternalJob as apiCreateExternalJob, listExternalJobs, listCompanyRequests, createJob as apiCreateJob, listJobs as apiListJobs } from '../../global/api';
import { getAuth } from '../../global/auth';
import CompanyRequestModal from '../../components/CompanyRequestModal';
import { 
  User, 
  Globe, 
  Plus, 
  FileText, 
  Link,
  Users,
  CheckCircle
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
}

// interface JobRequest {
//   id: string;
//   title: string;
//   company: string;
//   status: 'Open' | 'Closed' | 'Pending';
//   studentCount: number;
// }

interface ExternalJob {
  companyName: string;
  jobTitle: string;
  description: string;
  location: string;
  jobType: string;
  externalUrl: string;
}

interface NewJobPosting {
  company: string;
  jobTitle: string;
  description: string;
  location: string;
  jobType: string;
  ctc: string;
  deadline: string;
}


const NewJobPost: React.FC = () => {
  // const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Company Requests');
  const [isAddExternalJobModalOpen, setIsAddExternalJobModalOpen] = useState<boolean>(false);
  const [isNewJobPostingModalOpen, setIsNewJobPostingModalOpen] = useState<boolean>(false);
  const [isCompanyRequestModalOpen, setIsCompanyRequestModalOpen] = useState<boolean>(false);
  const [externalJobForm, setExternalJobForm] = useState<ExternalJob>({
    companyName: '',
    jobTitle: '',
    description: '',
    location: '',
    jobType: 'Full-time',
    externalUrl: ''
  });
  const [newJobPostingForm, setNewJobPostingForm] = useState<NewJobPosting>({
    company: '',
    jobTitle: '',
    description: '',
    location: '',
    jobType: 'Full-time',
    ctc: '',
    deadline: ''
  });

  // State for external jobs from backend
  const [externalJobs, setExternalJobs] = useState<any[]>([]);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [companyRequests, setCompanyRequests] = useState<any[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isViewApplicationsModalOpen, setIsViewApplicationsModalOpen] = useState<boolean>(false);
  const [selectedJobApplications, setSelectedJobApplications] = useState<any[]>([]);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // const toggleProfile = (): void => {
  //   setIsProfileOpen(!isProfileOpen);
  // };

  const handleTabChange = (tabLabel: string): void => {
    setActiveTab(tabLabel);
  };

  // const handleProfileAction = (action: string): void => {
  //   console.log(`Profile action: ${action}`);
  //   setIsProfileOpen(false);
  // };

  const openAddExternalJobModal = (): void => {
    setIsAddExternalJobModalOpen(true);
  };

  const closeAddExternalJobModal = (): void => {
    setIsAddExternalJobModalOpen(false);
    // Reset form
    setExternalJobForm({
      companyName: '',
      jobTitle: '',
      description: '',
      location: '',
      jobType: 'Full-time',
      externalUrl: ''
    });
  };

  const openNewJobPostingModal = (): void => {
    setIsNewJobPostingModalOpen(true);
  };

  const closeNewJobPostingModal = (): void => {
    setIsNewJobPostingModalOpen(false);
    setEditingJobId(null);
    // Reset form
    setNewJobPostingForm({
      company: '',
      jobTitle: '',
      description: '',
      location: '',
      jobType: 'Full-time',
      ctc: '',
      deadline: ''
    });
  };

  const openCompanyRequestModal = (): void => {
    setIsCompanyRequestModalOpen(true);
  };

  const closeCompanyRequestModal = (): void => {
    setIsCompanyRequestModalOpen(false);
  };

  const closeViewApplicationsModal = (): void => {
    setIsViewApplicationsModalOpen(false);
    setSelectedJobApplications([]);
    setSelectedJobForApplications(null);
  };

  const handleApplicationStatusUpdate = (applicationId: string, newStatus: string) => {
    setSelectedJobApplications(prev => 
      prev.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    );
  };

  const handleRequestSelection = (request: any) => {
    setSelectedRequest(request);
  };

  const handleLinkGenerated = (linkData: { linkId: string; companyName: string; jobRole: string; link: string }) => {
    setGeneratedLinks(prev => [linkData, ...prev]);
    fetchGeneratedLinks(); // Refresh the list
  };

  const handleExternalJobFormChange = (field: keyof ExternalJob, value: string): void => {
    setExternalJobForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // API call to create external job
  const handleAddExternalJob = async (): Promise<void> => {
    try {
      // Basic client-side validation to match backend requirements
      if (!externalJobForm.companyName || !externalJobForm.jobTitle || !externalJobForm.description || !externalJobForm.location || !externalJobForm.jobType || !externalJobForm.externalUrl) {
        alert('Please fill all required fields and provide a valid external URL.');
        return;
      }
      if (!/^https?:\/\//i.test(externalJobForm.externalUrl)) {
        alert('External URL must start with http:// or https://');
        return;
      }
      const token = getAuth()?.token || '';
      const data = await apiCreateExternalJob(token, externalJobForm as any);
      if (data?.success) {
        // You can add a success notification here
        closeAddExternalJobModal();
        // Refresh the external jobs list
        fetchExternalJobs();
      } else {
        console.error('Failed to create external job:', data);
        alert(`Create external job failed: ${(data as any)?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating external job:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error creating external job: ${message}`);
    }
  };

  // Fetch external jobs from backend
  const fetchExternalJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await listExternalJobs({ status: 'Active', limit: 10 });
      if ((data as any)?.success) {
        setExternalJobs((data as any).data);
      } else {
        console.error('Failed to fetch external jobs:', (data as any)?.message);
      }
    } catch (error) {
      console.error('Error fetching external jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lists when tabs change
  useEffect(() => {
    if (activeTab === 'External Jobs') {
      fetchExternalJobs();
    } else if (activeTab === 'Job Postings') {
      fetchJobPostings();
    } else if (activeTab === 'Company Requests') {
      fetchCompanyRequests();
    }
  }, [activeTab]);

  // Fetch generated links on component mount
  useEffect(() => {
    fetchGeneratedLinks();
  }, []);

  const handleNewJobPostingFormChange = (field: keyof NewJobPosting, value: string): void => {
    setNewJobPostingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Create or update internal job posting
  const handleCreateJobPosting = async (): Promise<void> => {
    try {
      const token = getAuth()?.token || null;
      const payload = {
        company: newJobPostingForm.company,
        title: newJobPostingForm.jobTitle,
        description: newJobPostingForm.description,
        location: newJobPostingForm.location,
        jobType: newJobPostingForm.jobType,
        ctc: newJobPostingForm.ctc,
        deadline: newJobPostingForm.deadline
      };

      let data;
      if (editingJobId) {
        // Update existing job
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/jobs/${editingJobId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        data = await response.json();
      } else {
        // Create new job
        data = await apiCreateJob(token, payload as any);
      }

      if (data?.success) {
        closeNewJobPostingModal();
        fetchJobPostings();
        alert(editingJobId ? 'Job updated successfully!' : 'Job created successfully!');
      } else {
        console.error('Failed to save job posting:', data);
        alert(`Save job failed: ${(data as any)?.message || (data as any)?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving job posting:', err);
      alert('Network error while saving job posting. Check console for details.');
    }
  };


  // Fetch job postings
  const fetchJobPostings = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await apiListJobs({ limit: 10 });
      if ((data as any)?.success) {
        const items = Array.isArray((data as any).data?.items) ? (data as any).data.items : (Array.isArray((data as any).data) ? (data as any).data : []);
        setJobPostings(items as any[]);
      } else {
        console.error('Failed to fetch job postings:', (data as any)?.message || (data as any)?.error);
      }
    } catch (err) {
      console.error('Error fetching job postings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch company requests
  const fetchCompanyRequests = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await listCompanyRequests({ limit: 10 });
      if ((data as any)?.success) {
        const items = Array.isArray((data as any).data) ? (data as any).data : (Array.isArray((data as any).requests) ? (data as any).requests : []);
        setCompanyRequests(items as any[]);
      } else {
        console.error('Failed to fetch company requests:', (data as any)?.message || (data as any)?.error);
      }
    } catch (err) {
      console.error('Error fetching company requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch generated links
  const fetchGeneratedLinks = async (): Promise<void> => {
    try {
      const token = getAuth()?.token || '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${baseUrl}/api/companies/form-links`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGeneratedLinks(data.data);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching generated links:', errorData);
      }
    } catch (err) {
      console.error('Error fetching generated links:', err);
    }
  };

  // Handle approve/reject company request
  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const token = getAuth()?.token || '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/companies/requests/${requestId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchCompanyRequests(); // Refresh the list
          if (action === 'approve') {
            // When approved, also refresh job postings to show the new job
            fetchJobPostings();
            alert('Request approved and job posting created successfully!');
          } else {
            alert('Request rejected successfully');
          }
        }
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      alert(`Failed to ${action} request`);
    }
  };

  // Handle viewing applications for a job
  const handleViewApplications = (job: any) => {
    // Mock application data - in a real app, this would fetch from API
    const mockApplications = [
      {
        id: '1',
        studentName: 'John Doe',
        email: 'john.doe@student.edu',
        phone: '+91 98765 43210',
        cgpa: 8.5,
        branch: 'Computer Science',
        year: '2024',
        resumeUrl: '/resumes/john_doe_resume.pdf',
        appliedDate: '2024-01-15',
        status: 'Pending',
        skills: ['React', 'Node.js', 'Python', 'MongoDB'],
        experience: '2 internships, 1 project',
        coverLetter: 'I am very interested in this position and believe my skills align well with your requirements...'
      },
      {
        id: '2',
        studentName: 'Jane Smith',
        email: 'jane.smith@student.edu',
        phone: '+91 98765 43211',
        cgpa: 9.2,
        branch: 'Information Technology',
        year: '2024',
        resumeUrl: '/resumes/jane_smith_resume.pdf',
        appliedDate: '2024-01-14',
        status: 'Shortlisted',
        skills: ['JavaScript', 'React', 'Express', 'PostgreSQL'],
        experience: '1 internship, 3 projects',
        coverLetter: 'I have been following your company and am excited about the opportunity to contribute...'
      },
      {
        id: '3',
        studentName: 'Mike Johnson',
        email: 'mike.johnson@student.edu',
        phone: '+91 98765 43212',
        cgpa: 7.8,
        branch: 'Computer Science',
        year: '2024',
        resumeUrl: '/resumes/mike_johnson_resume.pdf',
        appliedDate: '2024-01-13',
        status: 'Rejected',
        skills: ['Java', 'Spring Boot', 'MySQL'],
        experience: '1 project',
        coverLetter: 'I am eager to start my career in software development...'
      }
    ];

    setSelectedJobForApplications(job);
    setSelectedJobApplications(mockApplications);
    setIsViewApplicationsModalOpen(true);
  };

  // Handle editing a job posting
  const handleEditJob = (job: any) => {
    // Pre-fill the form with existing job data
    setNewJobPostingForm({
      company: job.company || '',
      jobTitle: job.title || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || 'Full-time',
      ctc: job.ctc || '',
      deadline: job.deadline || ''
    });
    
    // Open the modal for editing
    setIsNewJobPostingModalOpen(true);
    
    // Store the job ID for updating
    setEditingJobId(job._id);
  };



  const tabs: Tab[] = [
    { id: 'company-requests', label: 'Company Requests' },
    { id: 'job-postings', label: 'Job Postings' },
    { id: 'external-jobs', label: 'External Jobs' },
    { id: 'analytics', label: 'Analytics' }
  ];

  

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-auto border border-gray-200 rounded-lg">
      {/* Header */}
      

      {/* Main Content */}
      <div className="w-full min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full max-w-none px-2 sm:px-6 py-6">
          {/* Title + Actions */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-800 leading-tight">Company Management</h1>
              <p className="text-sm sm:text-base md:text-lg text-blue-600">Manage job requests, postings, and external job tracking.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 sm:flex-wrap w-full sm:w-auto">
              <button 
                className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg hover:from-pink-600 hover:via-orange-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
                onClick={openAddExternalJobModal}
              >
                <Globe className="h-5 w-5 mr-2" />
                Add External Job
              </button>
              <button 
                className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
                onClick={openNewJobPostingModal}
              >
                <Plus className="h-5 w-5 mr-2" />
                New Job Posting
              </button>
              <button 
                className="flex items-center justify-center px-5 py-3 text-white rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500  hover:from-pink-600 hover:via-orange-600 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
                onClick={openCompanyRequestModal}
              >
                <Plus className="h-5 w-5 mr-2" />
                New Request
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 bg-white rounded-lg p-2 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.label)}
                  className={`px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 w-full ${
                    activeTab === tab.label
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Cards */}
          {activeTab === 'Company Requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Active Requests Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white/20 rounded-lg p-2 mr-3">
                        <FileText className="h-6 w-6" />
                </div>
                      <div>
                        <h3 className="text-xl font-bold">Active Requests</h3>
                        <p className="text-blue-100 text-sm">{companyRequests.length} pending requests</p>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-full px-3 py-1">
                      <span className="text-sm font-medium">{companyRequests.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                  {companyRequests.map((req) => (
                      <div 
                        key={req._id} 
                        onClick={() => handleRequestSelection(req)}
                        className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-200 cursor-pointer ${
                          selectedRequest?._id === req._id ? 'ring-2 ring-blue-500 bg-blue-100' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                            <div className="bg-blue-500 rounded-full p-1 mr-3">
                              <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-sm">{req.jobRole}</h4>
                              <p className="text-gray-600 text-xs">{req.company}</p>
                      </div>
                      </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {req.status || 'Pending'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-xs mb-3">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{req.studentsRequired || 0} students required</span>
                        </div>
                        
                        {req.formData && (
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <span className="font-medium w-16">Contact:</span>
                                <span className="truncate">{req.formData.contactPerson}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium w-16">Email:</span>
                                <span className="truncate text-blue-600">{req.formData.email}</span>
                              </div>
                              {req.formData.phone && (
                                <div className="flex items-center">
                                  <span className="font-medium w-16">Phone:</span>
                                  <span>{req.formData.phone}</span>
                                </div>
                              )}
                              {req.formData.salaryRange && (
                                <div className="flex items-center">
                                  <span className="font-medium w-16">Salary:</span>
                                  <span className="text-green-600 font-medium">{req.formData.salaryRange}</span>
                                </div>
                              )}
                              {req.formData.submittedAt && (
                                <div className="flex items-center">
                                  <span className="font-medium w-16">Date:</span>
                                  <span>{new Date(req.formData.submittedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            
                            {req.status === 'Pending' && (
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => handleRequestAction(req._id, 'approve')}
                                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs py-2 px-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleRequestAction(req._id, 'reject')}
                                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs py-2 px-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                  {companyRequests.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No requests yet</p>
                        <p className="text-gray-400 text-xs">Company requests will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Request Details Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white/20 rounded-lg p-2 mr-3">
                        <FileText className="h-6 w-6" />
                </div>
                      <div>
                        <h3 className="text-xl font-bold">Request Details</h3>
                        <p className="text-purple-100 text-sm">Detailed view of selected request</p>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-full px-3 py-1">
                      <span className="text-sm font-medium">View</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto">
                  {selectedRequest ? (
                    <div className="space-y-4">
                      {/* Request Header */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-1">{selectedRequest.jobRole}</h4>
                            <p className="text-gray-600 text-sm">{selectedRequest.company}</p>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            selectedRequest.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            selectedRequest.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {selectedRequest.status || 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{selectedRequest.studentsRequired || 0} students required</span>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-purple-600" />
                          Job Details
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Description:</span>
                            <span className="text-gray-800 text-right max-w-xs">{selectedRequest.description || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Minimum CGPA:</span>
                            <span className="text-gray-800">{selectedRequest.minimumCGPA || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Start Date:</span>
                            <span className="text-gray-800">{selectedRequest.startDate ? new Date(selectedRequest.startDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">End Date:</span>
                            <span className="text-gray-800">{selectedRequest.endDate ? new Date(selectedRequest.endDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Company Contact Information */}
                      {selectedRequest.formData && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-600" />
                            Company Contact
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600">Contact Person:</span>
                              <span className="text-gray-800">{selectedRequest.formData.contactPerson || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600">Email:</span>
                              <span className="text-blue-600">{selectedRequest.formData.email || 'N/A'}</span>
                            </div>
                            {selectedRequest.formData.phone && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Phone:</span>
                                <span className="text-gray-800">{selectedRequest.formData.phone}</span>
                              </div>
                            )}
                            {selectedRequest.formData.salaryRange && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Salary Range:</span>
                                <span className="text-green-600 font-medium">{selectedRequest.formData.salaryRange}</span>
                              </div>
                            )}
                            {selectedRequest.formData.location && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Location:</span>
                                <span className="text-gray-800">{selectedRequest.formData.location}</span>
                              </div>
                            )}
                            {selectedRequest.formData.jobType && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Job Type:</span>
                                <span className="text-gray-800">{selectedRequest.formData.jobType}</span>
                              </div>
                            )}
                            {selectedRequest.formData.submittedAt && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Submitted:</span>
                                <span className="text-gray-800">{new Date(selectedRequest.formData.submittedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Additional Information */}
                      {selectedRequest.formData?.additionalInfo && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-green-600" />
                            Additional Information
                          </h5>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                            {selectedRequest.formData.additionalInfo}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {selectedRequest.status === 'Pending' && (
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleRequestAction(selectedRequest._id, 'approve')}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium text-sm"
                          >
                            ✓ Approve Request
                          </button>
                          <button
                            onClick={() => handleRequestAction(selectedRequest._id, 'reject')}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium text-sm"
                          >
                            ✗ Reject Request
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                <div className="flex flex-col items-center justify-center py-12">
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full p-6 mb-4">
                        <FileText className="h-16 w-16 text-purple-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Select a Request</h4>
                      <p className="text-gray-500 text-center text-sm max-w-xs">
                        Click on any request from the Active Requests panel to view detailed information here
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Links Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 lg:col-span-2 xl:col-span-1">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white/20 rounded-lg p-2 mr-3">
                        <Link className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Generated Form Links</h3>
                        <p className="text-blue-100 text-sm">{generatedLinks.length} active links</p>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-full px-3 py-1">
                      <span className="text-sm font-medium">{generatedLinks.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {generatedLinks.map((link) => (
                      <div key={link.linkId} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-blue-500 rounded-full p-1 mr-3">
                              <Link className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-sm">{link.companyName}</h4>
                              <p className="text-gray-600 text-xs">{link.jobRole}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Active
                          </span>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-600">Form Link:</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(link.link)}
                              className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 transition-colors duration-200"
                            >
                              Copy Link
                            </button>
                          </div>
                          <div className="bg-gray-50 rounded p-2 border">
                            <p className="text-xs text-gray-700 break-all font-mono">{link.link}</p>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Created:</span> {new Date(link.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {generatedLinks.length === 0 && (
                      <div className="text-center py-8">
                        <Link className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No links generated yet</p>
                        <p className="text-gray-400 text-xs">Generate form links to start collecting requests</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Job Postings' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center mb-6">
                <FileText className="h-8 w-8 text-blue-600 mr-3 mb-2 sm:mb-0" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">Active Job Postings</h2>
                  <p className="text-base sm:text-lg text-blue-600">{jobPostings.length} active job postings</p>
                </div>
              </div>

              {/* Job Posting Cards */}
              <div className="space-y-4">
                {jobPostings.map((job) => (
                  <div key={job._id} className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 mb-4 lg:mb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center mb-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2 sm:mb-0 sm:mr-3 break-words">{job.title}</h3>
                          <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full w-fit">{job.jobType}</span>
                        </div>
                        <p className="text-blue-600 text-base sm:text-lg mb-4 break-words">{job.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                          <div className="flex items-center text-blue-700">
                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-words">{job.company}</span>
                          </div>
                          <div className="flex items-center text-blue-700">
                            <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-words">{job.location}</span>
                          </div>
                          <div className="flex items-center text-blue-700">
                            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-words">Deadline: {job.deadline || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-blue-700">
                            <span className="font-medium break-words">CTC: ₹{job.ctc || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 lg:ml-6">
                        <button 
                          onClick={() => handleViewApplications(job)}
                          className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">View Applications</span>
                          <span className="sm:hidden">Applications</span>
                        </button>
                        <button 
                          onClick={() => handleEditJob(job)}
                          className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {jobPostings.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-blue-200 mx-auto mb-4" />
                    <p className="text-blue-400">No job postings found</p>
                    <p className="text-blue-300 text-sm">Create your first job posting to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'External Jobs' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center mb-6">
                <Globe className="h-8 w-8 text-blue-600 mr-3 mb-2 sm:mb-0" />
                                 <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">External Job Opportunities</h2>
                  <p className="text-base sm:text-lg text-blue-600">
                     {loading ? 'Loading...' : `${externalJobs.length} external job opportunities being tracked`}
                   </p>
                 </div>
              </div>

              {/* External Job Cards */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600">Loading external jobs...</p>
                  </div>
                ) : externalJobs.length > 0 ? (
                  externalJobs.map((job) => (
                    <div key={job._id} className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 mb-4 lg:mb-0">
                          <div className="flex flex-col sm:flex-row sm:items-center mb-3">
                            <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2 sm:mb-0 sm:mr-3 break-words">{job.jobTitle}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">{job.jobType}</span>
                            <span className="px-3 py-1 bg-blue-300 text-white text-sm font-medium rounded-full">External</span>
                          </div>
                          </div>
                          <p className="text-blue-600 text-base sm:text-lg mb-4 break-words">{job.description}</p>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm">
                            <div className="flex items-center text-blue-700">
                              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="font-medium break-words">{job.companyName}</span>
                            </div>
                            <div className="flex items-center text-blue-700">
                              <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="break-words">{job.location}</span>
                            </div>
                            {job.salary && (job.salary.min || job.salary.max) && (
                              <div className="flex items-center text-blue-700">
                                <span className="font-medium break-words">
                                  {job.salary.min && job.salary.max 
                                    ? `${job.salary.currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
                                    : job.salary.min 
                                      ? `${job.salary.currency} ${job.salary.min.toLocaleString()}+`
                                      : `Up to ${job.salary.currency} ${job.salary.max.toLocaleString()}`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 lg:ml-6">
                          <a 
                            href={job.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                          >
                            <User className="h-4 w-4 mr-2" />
                            Apply
                          </a>
                          <button className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Track
                          </button>
                        </div> */}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Globe className="h-16 w-16 text-blue-200 mx-auto mb-4" />
                    <p className="text-blue-400">No external jobs found</p>
                    <p className="text-blue-300 text-sm">Add some external job opportunities to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Analytics' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center mb-6">
                {/* <Zap className="h-8 w-8 text-blue-600 mr-3" /> */}
            
              </div>

              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Requests Card */}
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Requests</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">1</div>
                    <p className="text-blue-600 text-sm">Company job requests</p>
                  </div>
                </div>

                {/* Active Jobs Card */}
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Active Jobs</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">2</div>
                    <p className="text-blue-600 text-sm">Posted job opportunities</p>
                  </div>
                </div>

                {/* External Jobs Card */}
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">External Jobs</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">2</div>
                    <p className="text-blue-600 text-sm">Tracked external opportunities</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

            {/* Add External Job Modal */}
      {isAddExternalJobModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
              {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Add External Job</h2>
              <button
                onClick={closeAddExternalJobModal}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Track external job opportunities for students
            </p>
            {/* Form */}
            <div className="space-y-4">
  {/* Company Name & Job Title */}
  <div className="flex flex-col md:flex-row gap-3">
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
      <input
        type="text"
        placeholder="e.g., Google, Microsoft"
        value={externalJobForm.companyName}
        onChange={(e) => handleExternalJobFormChange('companyName', e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
      />
    </div>
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
      <input
        type="text"
        placeholder="e.g., Software Engineer"
        value={externalJobForm.jobTitle}
        onChange={(e) => handleExternalJobFormChange('jobTitle', e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
      />
    </div>
  </div>

  {/* Description */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
    <textarea
      placeholder="Job description and requirements..."
      value={externalJobForm.description}
      onChange={(e) => handleExternalJobFormChange('description', e.target.value)}
      rows={4}
      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
    />
  </div>

  {/* Location & Job Type */}
  <div className="flex flex-col md:flex-row gap-3">
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
      <input
        type="text"
        placeholder="e.g., Remote, Bangalore"
        value={externalJobForm.location}
        onChange={(e) => handleExternalJobFormChange('location', e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
      />
    </div>
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
      <select
        value={externalJobForm.jobType}
        onChange={(e) => handleExternalJobFormChange('jobType', e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
      >
        <option value="Full-time">Full-time</option>
        <option value="Part-time">Part-time</option>
        <option value="Internship">Internship</option>
        <option value="Contract">Contract</option>
      </select>
    </div>
  </div>

  {/* External URL */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
    <input
      type="url"
      placeholder="https://company.com/careers/job"
      value={externalJobForm.externalUrl}
      onChange={(e) => handleExternalJobFormChange('externalUrl', e.target.value)}
      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
    />
  </div>
</div>

            {/* Footer */}
                         <div className="mt-6 flex justify-end">
               <button
                 onClick={handleAddExternalJob}
                 className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
               >
                 Add External Job
               </button>
             </div>
          </div>
                 </div>
       )}

       {/* New Job Posting Modal */}
       {isNewJobPostingModalOpen && (
         <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
             {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {editingJobId ? 'Edit Job Posting' : 'Create Job Posting'}
                    </h2>
                    <p className="text-blue-100">
                      {editingJobId ? 'Update the job posting details' : 'Post a new job opportunity for students'}
                    </p>
                  </div>
               <button
                 onClick={closeNewJobPostingModal}
                    className="text-white hover:text-blue-200 text-2xl font-bold"
               >
                 ×
               </button>
             </div>
             </div>

             {/* Form */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-600" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
      <input
        type="text"
                          placeholder="e.g., Google, Microsoft, Amazon"
        value={newJobPostingForm.company}
        onChange={(e) => handleNewJobPostingFormChange('company', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
      <input
        type="text"
                          placeholder="e.g., Software Engineer, Data Scientist"
        value={newJobPostingForm.jobTitle}
        onChange={(e) => handleNewJobPostingFormChange('jobTitle', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
                      </div>
    </div>
  </div>

                  {/* Job Details Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-green-600" />
                      Job Details
                    </h3>
                    <div className="space-y-4">
  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
    <textarea
                          placeholder="Describe the role, responsibilities, and requirements..."
      value={newJobPostingForm.description}
      onChange={(e) => handleNewJobPostingFormChange('description', e.target.value)}
                          rows={5}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
      <input
        type="text"
                            placeholder="e.g., Remote, Bangalore, Mumbai"
        value={newJobPostingForm.location}
        onChange={(e) => handleNewJobPostingFormChange('location', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
      <select
        value={newJobPostingForm.jobType}
        onChange={(e) => handleNewJobPostingFormChange('jobType', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="Full-time">Full-time</option>
        <option value="Part-time">Part-time</option>
        <option value="Internship">Internship</option>
        <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
      </select>
                        </div>
                      </div>
    </div>
  </div>

                  {/* Compensation & Timeline Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-purple-600" />
                      Compensation & Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Annual CTC (₹)</label>
      <input
                          type="text"
                          placeholder="e.g., 800000, 12-15 LPA"
        value={newJobPostingForm.ctc}
        onChange={(e) => handleNewJobPostingFormChange('ctc', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
                        <p className="text-xs text-gray-500 mt-1">Enter salary range or fixed amount</p>
    </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
      <input
        type="date"
        value={newJobPostingForm.deadline}
        onChange={(e) => handleNewJobPostingFormChange('deadline', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
                        <p className="text-xs text-gray-500 mt-1">Last date for students to apply</p>
                      </div>
                    </div>
    </div>
  </div>
</div>

             {/* Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                <button
                  onClick={closeNewJobPostingModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
               <button
                 onClick={handleCreateJobPosting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
               >
                  {editingJobId ? 'Update Job Posting' : 'Create Job Posting'}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Company Request Modal */}
        <CompanyRequestModal
          isOpen={isCompanyRequestModalOpen}
          onClose={closeCompanyRequestModal}
          onLinkGenerated={handleLinkGenerated}
        />

        {/* View Applications Modal */}
        {isViewApplicationsModalOpen && (
         <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
             {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Job Applications</h2>
                    <p className="text-blue-100">
                      {selectedJobForApplications?.title} at {selectedJobForApplications?.company}
                    </p>
                    <p className="text-blue-200 text-sm">
                      {selectedJobApplications.length} applications received
                    </p>
                  </div>
               <button
                    onClick={closeViewApplicationsModal}
                    className="text-white hover:text-blue-200 text-2xl font-bold"
               >
                 ×
               </button>
             </div>
             </div>

              {/* Applications List */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {selectedJobApplications.length > 0 ? (
                  <div className="space-y-6">
                    {selectedJobApplications.map((application) => (
                      <div key={application.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        {/* Application Header */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                          <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                            <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                              {application.studentName.split(' ').map((n: string) => n[0]).join('')}
    </div>
    <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800 mb-1">{application.studentName}</h3>
                              <p className="text-gray-600 mb-2">{application.email}</p>
                              <div className="flex flex-wrap gap-2 text-sm">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {application.branch}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  CGPA: {application.cgpa}
                                </span>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                  {application.year}
                                </span>
                              </div>
    </div>
  </div>

                          <div className="flex flex-col lg:items-end space-y-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              application.status === 'Shortlisted' ? 'bg-green-100 text-green-800' :
                              application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status}
                            </span>
                            <p className="text-sm text-gray-500">
                              Applied: {new Date(application.appliedDate).toLocaleDateString()}
                            </p>
                          </div>
  </div>

                        {/* Application Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          {/* Contact Information */}
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Contact Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center">
                                <span className="font-medium w-20">Phone:</span>
                                <span className="text-gray-600">{application.phone}</span>
    </div>
                              <div className="flex items-center">
                                <span className="font-medium w-20">Email:</span>
                                <span className="text-blue-600">{application.email}</span>
                              </div>
    </div>
  </div>

                          {/* Skills */}
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Skills & Experience
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium text-sm">Skills:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {application.skills.map((skill: string, index: number) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                      {skill}
                                    </span>
                                  ))}
    </div>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Experience:</span>
                                <span className="text-gray-600 ml-2">{application.experience}</span>
                              </div>
    </div>
  </div>
</div>

                        {/* Cover Letter */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Cover Letter</h4>
                          <p className="text-gray-600 text-sm bg-white p-3 rounded-lg border">
                            {application.coverLetter}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Resume
                          </button>
                          <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                            <Users className="h-4 w-4 mr-2" />
                            Schedule Interview
                          </button>
                          <div className="flex gap-2">
               <button
                              onClick={() => handleApplicationStatusUpdate(application.id, 'Shortlisted')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                application.status === 'Shortlisted' 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              Shortlist
                            </button>
                            <button 
                              onClick={() => handleApplicationStatusUpdate(application.id, 'Rejected')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                application.status === 'Rejected' 
                                  ? 'bg-red-200 text-red-800' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              Reject
               </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Applications Yet</h3>
                    <p className="text-gray-500">No students have applied for this job posting yet.</p>
                  </div>
                )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default NewJobPost;
