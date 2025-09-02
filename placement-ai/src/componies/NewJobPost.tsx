import React, { useState, useEffect } from 'react';
import { 

  User, 
 
  Globe, 
  Plus, 
  FileText, 
  Zap,

  // Building,
  Users,

} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
}

interface JobRequest {
  id: string;
  title: string;
  company: string;
  status: 'Open' | 'Closed' | 'Pending';
  studentCount: number;
}

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

interface CompanyRequest {
  company: string;
  jobRole: string;
  description: string;
  studentsRequired: string;
  minimumCGPA: string;
  startDate: string;
  endDate: string;
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
  const [companyRequestForm, setCompanyRequestForm] = useState<CompanyRequest>({
    company: '',
    jobRole: '',
    description: '',
    studentsRequired: '1',
    minimumCGPA: '0',
    startDate: '',
    endDate: ''
  });

  // State for external jobs from backend
  const [externalJobs, setExternalJobs] = useState<any[]>([]);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [companyRequests, setCompanyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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
    // Reset form
    setCompanyRequestForm({
      company: '',
      jobRole: '',
      description: '',
      studentsRequired: '1',
      minimumCGPA: '0',
      startDate: '',
      endDate: ''
    });
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
      const response = await fetch('http://localhost:5000/api/external-jobs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Get token from localStorage
        },
        body: JSON.stringify(externalJobForm)
      });

      const data = await response.json();

      if (data.success) {
        console.log('External job created successfully:', data.data);
        // You can add a success notification here
        closeAddExternalJobModal();
        // Refresh the external jobs list
        fetchExternalJobs();
      } else {
        console.error('Failed to create external job:', data.message);
        // You can add an error notification here
      }
    } catch (error) {
      console.error('Error creating external job:', error);
      // You can add an error notification here
    }
  };

  // Fetch external jobs from backend
  const fetchExternalJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/external-jobs?status=Active&limit=10');
      const data = await response.json();

      if (data.success) {
        setExternalJobs(data.data);
      } else {
        console.error('Failed to fetch external jobs:', data.message);
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

  const handleNewJobPostingFormChange = (field: keyof NewJobPosting, value: string): void => {
    setNewJobPostingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Create internal job posting
  const handleCreateJobPosting = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in as placement officer/admin to create a job.');
        return;
      }
      const payload = {
        company: newJobPostingForm.company,
        title: newJobPostingForm.jobTitle,
        description: newJobPostingForm.description,
        location: newJobPostingForm.location,
        jobType: newJobPostingForm.jobType,
        ctc: newJobPostingForm.ctc,
        deadline: newJobPostingForm.deadline
      };
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        closeNewJobPostingModal();
        fetchJobPostings();
      } else {
        console.error('Failed to create job posting:', data);
        alert(`Create job failed (${res.status}): ${data?.message || data?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating job posting:', err);
      alert('Network error while creating job posting. Check console for details.');
    }
  };

  const handleCompanyRequestFormChange = (field: keyof CompanyRequest, value: string): void => {
    setCompanyRequestForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create company request
  const handleCreateCompanyRequest = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in as placement officer/admin to create a request.');
        return;
      }
      const payload = {
        company: companyRequestForm.company,
        jobRole: companyRequestForm.jobRole,
        description: companyRequestForm.description,
        studentsRequired: Number(companyRequestForm.studentsRequired),
        minimumCGPA: Number(companyRequestForm.minimumCGPA),
        startDate: companyRequestForm.startDate,
        endDate: companyRequestForm.endDate
      };
      const res = await fetch('http://localhost:5000/api/companies/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        closeCompanyRequestModal();
        fetchCompanyRequests();
      } else {
        console.error('Failed to create company request:', data);
        alert(`Create request failed (${res.status}): ${data?.message || data?.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating company request:', err);
      alert('Network error while creating company request. Check console for details.');
    }
  };

  // Fetch job postings
  const fetchJobPostings = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/jobs?limit=10');
      const data = await res.json();
      if (data.success) {
        const items = Array.isArray(data.data?.items) ? data.data.items : (Array.isArray(data.data) ? data.data : []);
        setJobPostings(items);
      } else {
        console.error('Failed to fetch job postings:', data.message || data.error);
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
      const res = await fetch('http://localhost:5000/api/companies/requests?limit=10');
      const data = await res.json();
      if (data.success) {
        const items = Array.isArray(data.data) ? data.data : (Array.isArray(data.requests) ? data.requests : []);
        setCompanyRequests(items);
      } else {
        console.error('Failed to fetch company requests:', data.message || data.error);
      }
    } catch (err) {
      console.error('Error fetching company requests:', err);
    } finally {
      setLoading(false);
    }
  };



  const tabs: Tab[] = [
    { id: 'company-requests', label: 'Company Requests' },
    { id: 'job-postings', label: 'Job Postings' },
    { id: 'external-jobs', label: 'External Jobs' },
    { id: 'analytics', label: 'Analytics' }
  ];

  

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Header */}
      

      {/* Main Content */}
      <div className="w-full h-[calc(100vh-4rem)] overflow-y-hidden">
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Active Requests Card */}
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-6 w-6 text-blue-500 mr-2" />
                  <h3 className="text-xl font-semibold text-blue-800">Active Requests</h3>
                </div>
                <p className="text-blue-600 mb-4">{companyRequests.length} open requests</p>
                
                <div className="space-y-3">
                  {companyRequests.map((req) => (
                    <div key={req._id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="font-medium text-blue-800">{req.jobRole}</span>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{req.status || 'Open'}</span>
                      </div>
                      <p className="text-blue-600 text-sm mb-2">{req.company}</p>
                      <div className="flex items-center text-blue-600 text-sm">
                        <Users className="h-4 w-4 mr-1" />
                        {req.studentsRequired || 0} students
                      </div>
                    </div>
                  ))}
                  {companyRequests.length === 0 && (
                    <div className="text-blue-400 text-sm">No requests yet.</div>
                  )}
                </div>
              </div>

              {/* Request Details Card */}
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-6 w-6 text-purple-500 mr-2" />
                  <h3 className="text-xl font-semibold text-blue-800">Request Details</h3>
                </div>
                <p className="text-blue-600 mb-4">Select a request to view details</p>
                
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-blue-200 mb-4" />
                  <p className="text-blue-400 text-center">Select a request to view details</p>
                </div>
              </div>

              {/* AI Shortlist Preview Card */}
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                <div className="flex items-center mb-4">
                  <Zap className="h-6 w-6 text-pink-500 mr-2" />
                  <h3 className="text-xl font-semibold text-blue-800">AI Shortlist Preview</h3>
                </div>
                <p className="text-blue-600 mb-4">Select a request to generate shortlist</p>
                
                <div className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-16 w-16 text-pink-200 mb-4" />
                  <p className="text-blue-400 text-center">Select a request to generate shortlist</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Job Postings' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center mb-6">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-3xl font-bold text-blue-800">Active Job Postings</h2>
                  <p className="text-lg text-blue-600">{jobPostings.length} active job postings</p>
                </div>
              </div>

              {/* Job Posting Cards */}
              <div className="space-y-4">
                {jobPostings.map((job) => (
                  <div key={job._id} className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <h3 className="text-2xl font-bold text-blue-800 mr-3">{job.title}</h3>
                          <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">{job.jobType}</span>
                        </div>
                        <p className="text-blue-600 text-lg mb-4">{job.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-blue-700">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center text-blue-700">
                            <Globe className="h-4 w-4 mr-2" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center text-blue-700">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Deadline: {job.deadline || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-blue-700">
                            <User className="h-4 w-4 mr-2" />
                            <span>{job.ctc || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {jobPostings.length === 0 && (
                  <div className="text-blue-400 text-sm">No job postings yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'External Jobs' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center mb-6">
                <Globe className="h-8 w-8 text-blue-600 mr-3" />
                                 <div>
                   <h2 className="text-3xl font-bold text-blue-800">External Job Opportunities</h2>
                   <p className="text-lg text-blue-600">
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
                    <div key={job._id} className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <h3 className="text-2xl font-bold text-blue-800 mr-3">{job.jobTitle}</h3>
                            <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full mr-2">{job.jobType}</span>
                            <span className="px-3 py-1 bg-blue-300 text-white text-sm font-medium rounded-full">External</span>
                          </div>
                          <p className="text-blue-600 text-lg mb-4">{job.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center text-blue-700">
                              <Users className="h-5 w-5 mr-2" />
                              <span className="font-medium">{job.companyName}</span>
                            </div>
                            <div className="flex items-center text-blue-700">
                              <Globe className="h-5 w-5 mr-2" />
                              <span>{job.location}</span>
                            </div>
                            {job.salary && (job.salary.min || job.salary.max) && (
                              <div className="flex items-center text-blue-700">
                                <span className="font-medium">
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
                        
                        <div className="flex flex-col space-y-2 ml-6">
                          <a 
                            href={job.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                          >
                            <User className="h-4 w-4 mr-2" />
                            Apply
                          </a>
                          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                            <FileText className="h-4 w-4 mr-2" />
                            Track
                          </button>
                        </div>
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Add External Job</h2>
              <button
                onClick={closeAddExternalJobModal}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ×
              </button>
            </div>
            <div className="flex justify-between items-start mb-4">

            <p className="text-gray-500 text-sm mb-6">
              Track external job opportunities for students
            </p>
</div>
            {/* Form */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g., Google, Microsoft"
                  value={externalJobForm.companyName}
                  onChange={(e) => handleExternalJobFormChange('companyName', e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                />
                <input
                  type="text"
                  placeholder="e.g., Software Engineer"
                  value={externalJobForm.jobTitle}
                  onChange={(e) => handleExternalJobFormChange('jobTitle', e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                />
              </div>

              <textarea
                placeholder="Job description and requirements..."
                value={externalJobForm.description}
                onChange={(e) => handleExternalJobFormChange('description', e.target.value)}
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
              />

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g., Remote, Bangalore"
                  value={externalJobForm.location}
                  onChange={(e) => handleExternalJobFormChange('location', e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                />
                <select
                  value={externalJobForm.jobType}
                  onChange={(e) => handleExternalJobFormChange('jobType', e.target.value)}
                  className="w-full md:w-32 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
              </div>

              <input
                type="url"
                placeholder="https://company.com/careers/job"
                value={externalJobForm.externalUrl}
                onChange={(e) => handleExternalJobFormChange('externalUrl', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
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
           <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
             {/* Header */}
             <div className="flex justify-between items-start mb-4">
               <h2 className="text-lg font-semibold">Create Job Posting</h2>
               <button
                 onClick={closeNewJobPostingModal}
                 className="text-gray-500 hover:text-gray-800 text-xl"
               >
                 ×
               </button>
             </div>
             <div className="flex justify-between items-start mb-4">

             <p className="text-gray-500 text-sm mb-6">
               Post a new job opportunity for students
             </p>
             </div>

             {/* Form */}
             <div className="space-y-4">
               <div className="flex flex-col md:flex-row gap-3">
                 <select
                   value={newJobPostingForm.company}
                   onChange={(e) => handleNewJobPostingFormChange('company', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 >
                   <option value="">Select company</option>
                   <option value="Google">Google</option>
                   <option value="Microsoft">Microsoft</option>
                   <option value="Amazon">Amazon</option>
                   <option value="Apple">Apple</option>
                   <option value="Meta">Meta</option>
                 </select>
                 <input
                   type="text"
                   placeholder="e.g., Software Engineer"
                   value={newJobPostingForm.jobTitle}
                   onChange={(e) => handleNewJobPostingFormChange('jobTitle', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
               </div>

               <textarea
                 placeholder="Job description and requirements..."
                 value={newJobPostingForm.description}
                 onChange={(e) => handleNewJobPostingFormChange('description', e.target.value)}
                 rows={3}
                 className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
               />

               <div className="flex flex-col md:flex-row gap-3">
                 <input
                   type="text"
                   placeholder="e.g., Bangalore, Remote"
                   value={newJobPostingForm.location}
                   onChange={(e) => handleNewJobPostingFormChange('location', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
                 <select
                   value={newJobPostingForm.jobType}
                   onChange={(e) => handleNewJobPostingFormChange('jobType', e.target.value)}
                   className="w-full md:w-32 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 >
                   <option>Full-time</option>
                   <option>Part-time</option>
                   <option>Internship</option>
                   <option>Contract</option>
                 </select>
               </div>

               <div className="flex flex-col md:flex-row gap-3">
                 <input
                   type="text"
                   placeholder="0"
                   value={newJobPostingForm.ctc}
                   onChange={(e) => handleNewJobPostingFormChange('ctc', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
                 <input
                   type="text"
                   placeholder="dd-mm-yyyy"
                   value={newJobPostingForm.deadline}
                   onChange={(e) => handleNewJobPostingFormChange('deadline', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
               </div>
             </div>

             {/* Footer */}
             <div className="mt-6 flex justify-end">
               <button
                 onClick={handleCreateJobPosting}
                 className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
               >
                 Create Job Posting
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Company Request Modal */}
       {isCompanyRequestModalOpen && (
         <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 px-4">
           <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
             {/* Header */}
             <div className="flex justify-between items-start mb-4">
               <h2 className="text-lg font-semibold">Create Company Request</h2>
               <button
                 onClick={closeCompanyRequestModal}
                 className="text-gray-500 hover:text-gray-800 text-xl"
               >
                 ×
               </button>
             </div>
             <div className="flex justify-between items-start mb-4">

             <p className="text-gray-500 text-sm mb-6">
               Add a new job request from a company
             </p>
             </div>

             {/* Form */}
             <div className="space-y-4">
               <div className="flex flex-col md:flex-row gap-3">
                 <select
                   value={companyRequestForm.company}
                   onChange={(e) => handleCompanyRequestFormChange('company', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 >
                   <option value="">Select company</option>
                   <option value="Google">Google</option>
                   <option value="Microsoft">Microsoft</option>
                   <option value="Amazon">Amazon</option>
                   <option value="Apple">Apple</option>
                   <option value="Meta">Meta</option>
                 </select>
                 <input
                   type="text"
                   placeholder="e.g., Software Engineer"
                   value={companyRequestForm.jobRole}
                   onChange={(e) => handleCompanyRequestFormChange('jobRole', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
               </div>

               <textarea
                 placeholder="Job description and requirements..."
                 value={companyRequestForm.description}
                 onChange={(e) => handleCompanyRequestFormChange('description', e.target.value)}
                 rows={3}
                 className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
               />

               <div className="flex flex-col md:flex-row gap-3">
                 <input
                   type="number"
                   placeholder="1"
                   value={companyRequestForm.studentsRequired}
                   onChange={(e) => handleCompanyRequestFormChange('studentsRequired', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
                 <input
                   type="number"
                   placeholder="0"
                   value={companyRequestForm.minimumCGPA}
                   onChange={(e) => handleCompanyRequestFormChange('minimumCGPA', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
               </div>

               <div className="flex flex-col md:flex-row gap-3">
                 <input
                   type="text"
                   placeholder="dd-mm-yyyy"
                   value={companyRequestForm.startDate}
                   onChange={(e) => handleCompanyRequestFormChange('startDate', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
                 <input
                   type="text"
                   placeholder="dd-mm-yyyy"
                   value={companyRequestForm.endDate}
                   onChange={(e) => handleCompanyRequestFormChange('endDate', e.target.value)}
                   className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                 />
               </div>
             </div>

             {/* Footer */}
             <div className="mt-6 flex justify-end">
               <button
                 onClick={handleCreateCompanyRequest}
                 className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
               >
                 Create Request
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default NewJobPost;
