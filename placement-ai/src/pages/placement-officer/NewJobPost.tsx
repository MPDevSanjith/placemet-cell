import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExternalJob as apiCreateExternalJob, listExternalJobs, listCompanyRequests, createJob as apiCreateJob, listJobs as apiListJobs, listCompanyFormLinks, approveCompanyRequest, rejectCompanyRequest, sendExternalJobEmail, updateJob, getJobApplications, sendJobApplicationsEmail, getStudentActiveResumeViewUrl } from '../../global/api';
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
  minCgpa?: string;
}


const NewJobPost: React.FC = () => {
  const navigate = useNavigate();
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
    deadline: '',
    minCgpa: ''
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
  const [sentJobs, setSentJobs] = useState<Record<string, boolean>>({});
  const [sendAllOpen, setSendAllOpen] = useState<boolean>(false);
  const [sendAllEmail, setSendAllEmail] = useState<string>('');

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
      deadline: '',
      minCgpa: ''
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

  // Removed unused per-application status update handler


  const handleLinkGenerated = (linkData: { linkId: string; companyName: string; link: string }) => {
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
        // Load persisted sent map
        try {
          const saved = localStorage.getItem('po_external_sent')
          if (saved) setSentJobs((m) => ({ ...JSON.parse(saved), ...m }))
        } catch {}
      } else {
        console.error('Failed to fetch external jobs:', (data as any)?.message);
      }
    } catch (error) {
      console.error('Error fetching external jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendExternalJobEmail = async (jobId: string) => {
    try {
      const token = getAuth()?.token || ''
      const data = await sendExternalJobEmail(token, jobId)
      alert(`Emails queued to ${data.sent}/${data.total} students`)
      setSentJobs(prev => {
        const next = { ...prev, [jobId]: true }
        try { localStorage.setItem('po_external_sent', JSON.stringify(next)) } catch {}
        return next
      })
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to send emails')
    }
  }

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
        deadline: newJobPostingForm.deadline,
        minCgpa: newJobPostingForm.minCgpa ? Number(newJobPostingForm.minCgpa) : 0
      };

      let data;
      if (editingJobId) {
        // Update existing job
        data = await updateJob(token, editingJobId, payload as any);
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
      
      const data = await listCompanyFormLinks(token);
      
      if (data.success) {
        setGeneratedLinks(data.data);
      } else {
        console.error('Error fetching generated links:', data);
      }
    } catch (err) {
      console.error('Error fetching generated links:', err);
    }
  };

  // Handle approve/reject company request
  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const token = getAuth()?.token || '';
      
      let data;
      if (action === 'approve') {
        data = await approveCompanyRequest(token, requestId);
      } else {
        data = await rejectCompanyRequest(token, requestId);
      }
      
      if (data.success) {
        fetchCompanyRequests(); // Refresh the list
        if (action === 'approve') {
          // When approved, also refresh job postings to show the new job
          fetchJobPostings();
          alert('Request approved and job posting created successfully!');
        } else {
          alert('Request rejected successfully');
        }
      } else {
        console.error(`Error ${action}ing request:`, data);
        alert(`Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      alert(`Failed to ${action} request`);
    }
  };

  // Handle viewing applications for a job
  const handleViewApplications = async (job: any) => {
    try {
      const token = getAuth()?.token || ''
      const data = await getJobApplications(token, job._id)
      
      if (!data.success) throw new Error('Failed to load applications')

      const apps = (data.items || []).map((a: any) => ({
        id: a._id,
        studentName: a.student?.name || 'Student',
        email: a.student?.email || '',
        phone: a.student?.phone || '',
        cgpa: a.student?.onboardingData?.academicInfo?.gpa || a.student?.gpa || '-',
        branch: a.student?.branch || '-',
        year: a.student?.year || '-',
        resumeUrl: a.resume?.viewUrl || a.resume?.cloudinaryUrl || '',
        resumeId: a.resume?._id || a.resume?.id,
        studentId: a.student?._id || a.student?.id,
        appliedDate: a.createdAt,
        status: a.status || 'Pending',
        skills: a.student?.onboardingData?.academicInfo?.skills || [],
        experience: a.student?.internships?.length ? `${a.student?.internships?.length} internships` : '',
        coverLetter: ''
      }))

      setSelectedJobForApplications(job)
      setSelectedJobApplications(apps)
      setIsViewApplicationsModalOpen(true)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to load applications')
    }
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
      deadline: job.deadline || '',
      minCgpa: (typeof job.minCgpa === 'number' ? String(job.minCgpa) : (job.minCgpa || ''))
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
    <div className="min-h-screen w-full bg-gray-50">
      {/* Main Content */}
      <div className="w-full min-h-screen overflow-y-auto">
        <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          {/* Title + Actions */}
          <div className="mb-8 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 xl:gap-8">
            <div className="min-w-0 flex-1 xl:max-w-2xl">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 leading-tight">Company Management</h1>
              <p className="text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-600 mt-2">Manage job requests, postings, and external job tracking.</p>
            </div>
            <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row gap-3 flex-shrink-0 w-full xl:w-auto">
              <button 
                className="flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm w-full sm:w-auto text-sm lg:text-base"
                onClick={openAddExternalJobModal}
              >
                <Globe className="h-5 w-5 lg:h-6 lg:w-6 mr-2" />
                Add External Job
              </button>
              <button 
                className="flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm w-full sm:w-auto text-sm lg:text-base"
                onClick={openNewJobPostingModal}
              >
                <Plus className="h-5 w-5 lg:h-6 lg:w-6 mr-2" />
                New Job Posting
              </button>
              <button 
                className="flex items-center justify-center px-6 py-3 lg:px-8 lg:py-4 text-gray-800 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm w-full sm:w-auto text-sm lg:text-base"
                onClick={openCompanyRequestModal}
              >
                <Plus className="h-5 w-5 lg:h-6 lg:w-6 mr-2" />
                New Request
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.label)}
                  className={`px-6 py-4 text-sm lg:text-base font-medium rounded-lg transition-all duration-200 w-full ${
                    activeTab === tab.label
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Cards */}
          {activeTab === 'Company Requests' && (
            <div className="space-y-8">
              {/* Active Requests Card - full width */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-6 lg:p-8 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white rounded-lg p-2 mr-3 border border-gray-200">
                        <FileText className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Active Requests</h3>
                      </div>
                    </div>
                    <div className="bg-white rounded-full px-3 py-1 border border-gray-200">
                      <span className="text-sm font-medium text-gray-800">{companyRequests.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 lg:p-8 h-96 lg:h-[28rem] overflow-y-auto">
                  <div className="space-y-4 lg:space-y-6">
                  {companyRequests.map((req) => (
                      <div 
                        key={req._id} 
                        className={`bg-white rounded-xl p-4 lg:p-6 border border-gray-200`}
                      >
                        <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                            <div className="rounded-full p-1 mr-3 border border-gray-300">
                              <CheckCircle className="h-3 w-3 text-gray-700" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-sm lg:text-base">{req.jobRole}</h4>
                              <p className="text-gray-600 text-xs lg:text-sm">{req.company}</p>
                      </div>
                      </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                            req.status === 'Pending' ? 'text-gray-700 border-gray-300' :
                            req.status === 'Approved' ? 'text-gray-700 border-gray-300' :
                            'text-gray-700 border-gray-300'
                          }`}>
                            {req.status || 'Pending'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-xs mb-3">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{req.studentsRequired || 0} students required</span>
                        </div>
                        
                        {req.formData && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <span className="font-medium w-16">HR Name:</span>
                                <span className="truncate">{req.formData.hrName || req.formData.contactPerson}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium w-16">HR Email:</span>
                                <span className="truncate text-gray-800">{req.formData.hrEmail || req.formData.email}</span>
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
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => navigate(`/placement-officer/requests/${req._id}`)}
                                className="flex-1 bg-white border border-gray-300 text-gray-800 text-xs py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                              >
                                View Details
                              </button>
                              {req.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleRequestAction(req._id, 'approve')}
                                    className="flex-1 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(req._id, 'reject')}
                                    className="flex-1 bg-white border border-gray-300 text-gray-800 text-xs py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                  >
                                    ✗ Reject
                                  </button>
                                </>
                              )}
                            </div>
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

              {/* Generated Links Card: full width below */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white rounded-lg p-2 mr-3 border border-gray-200">
                        <Link className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Generated Form Links</h3>
                        <p className="text-gray-600 text-sm">{generatedLinks.length} active links</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-full px-3 py-1 border border-gray-200">
                      <span className="text-sm font-medium text-gray-800">{generatedLinks.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 h-96 lg:h-[28rem] overflow-y-auto">
                  <div className="space-y-4">
                    {generatedLinks.map((link) => (
                      <div key={link.linkId} className="bg-white rounded-xl p-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="rounded-full p-1 mr-3 border border-gray-300">
                              <Link className="h-3 w-3 text-gray-700" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-sm">{link.companyName}</h4>
                              <p className="text-gray-600 text-xs">{link.jobRole}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-gray-700 text-xs font-medium rounded-full border">Active</span>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-600">Form Link:</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(link.link)}
                              className="ml-auto bg-gray-900 text-white text-xs px-2 py-1 rounded hover:bg-gray-800 transition-colors"
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
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center mb-8">
                <FileText className="h-10 w-10 lg:h-12 lg:w-12 text-gray-700 mr-4 mb-3 lg:mb-0" />
                <div>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900">Active Job Postings</h2>
                  <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 mt-2">{jobPostings.length} active job postings</p>
                </div>
              </div>

              {/* Job Posting Cards */}
              <div className="space-y-6 lg:space-y-8">
                {jobPostings.map((job) => (
                  <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1 mb-6 xl:mb-0">
                        <div className="flex flex-col lg:flex-row lg:items-center mb-4">
                          <h3 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-3 lg:mb-0 lg:mr-4 break-words">{job.title}</h3>
                          <span className="px-4 py-2 bg-gray-900 text-white text-sm lg:text-base font-medium rounded-full w-fit">{job.jobType}</span>
                        </div>
                        {/* Hide long description in list view to keep cards compact */}
                        {/* <p className="text-gray-700 text-lg lg:text-xl xl:text-2xl mb-6 break-words">{job.description}</p> */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 text-sm lg:text-base">
                          <div className="flex items-center text-gray-700">
                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-words">{job.company}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-words">{job.location}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <span className="font-medium break-words">CTC: ₹{job.ctc || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row xl:flex-col space-y-3 lg:space-y-0 lg:space-x-4 xl:space-x-0 xl:space-y-3 xl:ml-8">
                        <button 
                          onClick={() => handleViewApplications(job)}
                          className="flex items-center justify-center px-4 lg:px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm lg:text-base"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">View Applications</span>
                          <span className="sm:hidden">Applications</span>
                        </button>
                        <button 
                          onClick={() => handleEditJob(job)}
                          className="flex items-center justify-center px-4 lg:px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm lg:text-base"
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
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center mb-8">
                <Globe className="h-10 w-10 lg:h-12 lg:w-12 text-gray-700 mr-4 mb-3 lg:mb-0" />
                <div>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900">External Job Opportunities</h2>
                  <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 mt-2">
                     {loading ? 'Loading...' : `${externalJobs.length} external job opportunities being tracked`}
                   </p>
                 </div>
              </div>

              {/* External Job Cards */}
              <div className="space-y-6 lg:space-y-8">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600">Loading external jobs...</p>
                  </div>
                ) : externalJobs.length > 0 ? (
                  externalJobs.map((job) => (
                    <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex-1 mb-6 xl:mb-0">
                          <div className="flex flex-col lg:flex-row lg:items-center mb-4">
                            <h3 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-3 lg:mb-0 lg:mr-4 break-words">{job.jobTitle}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-4 py-2 bg-gray-900 text-white text-sm lg:text-base font-medium rounded-full">{job.jobType}</span>
                            <span className="px-4 py-2 bg-gray-600 text-white text-sm lg:text-base font-medium rounded-full">External</span>
                          </div>
                          </div>
                          <p className="text-gray-700 text-lg lg:text-xl xl:text-2xl mb-6 break-words">{job.description}</p>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 text-sm lg:text-base">
                            <div className="flex items-center text-gray-700">
                              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="font-medium break-words">{job.companyName}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
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
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <a 
                            href={job.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                          >
                            <User className="h-4 w-4 mr-2" />
                            Open Link
                          </a>
                          {sentJobs[job._id] ? (
                            <button 
                              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg cursor-default text-sm"
                              disabled
                            >
                            <FileText className="h-4 w-4 mr-2" />
                              Sent
                          </button>
                          ) : (
                            <button 
                              onClick={() => handleSendExternalJobEmail(job._id)}
                              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Send Mail
                            </button>
                          )}
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
                {/* Active Requests Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Requests</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{companyRequests.length}</div>
                    <p className="text-gray-600 text-sm">Company job requests</p>
                  </div>
                </div>

                {/* Job Postings Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Job Postings</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{jobPostings.length}</div>
                    <p className="text-gray-600 text-sm">Posted job opportunities</p>
                  </div>
                </div>

                {/* External Jobs Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">External Jobs</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{externalJobs.length}</div>
                    <p className="text-gray-600 text-sm">Tracked external opportunities</p>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl p-6 lg:p-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">Add External Job</h2>
              <button onClick={closeAddExternalJobModal} className="text-gray-500 hover:text-gray-800 text-2xl">×</button>
            </div>
            <p className="text-gray-600 text-base lg:text-lg mb-6">Track external opportunities for students. Provide the basic info and the external link.</p>

            <div className="space-y-6">
              <details open className="rounded-xl border border-gray-200">
                <summary className="cursor-pointer select-none px-4 py-3 text-base lg:text-lg font-medium text-gray-800">Company & Role</summary>
                <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-sm lg:text-base text-gray-700 mb-2">Company Name</label>
                    <input type="text" placeholder="e.g., Google" value={externalJobForm.companyName} onChange={(e)=>handleExternalJobFormChange('companyName', e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm lg:text-base text-gray-700 mb-2">Job Title</label>
                    <input type="text" placeholder="e.g., Software Engineer" value={externalJobForm.jobTitle} onChange={(e)=>handleExternalJobFormChange('jobTitle', e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm lg:text-base text-gray-700 mb-2">Description</label>
                    <textarea rows={4} placeholder="Short description and requirements" value={externalJobForm.description} onChange={(e)=>handleExternalJobFormChange('description', e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
              </details>

              <details open className="rounded-xl border border-gray-200">
                <summary className="cursor-pointer select-none px-4 py-3 text-base lg:text-lg font-medium text-gray-800">Location & Type</summary>
                <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-sm lg:text-base text-gray-700 mb-2">Location</label>
                    <input type="text" placeholder="e.g., Remote" value={externalJobForm.location} onChange={(e)=>handleExternalJobFormChange('location', e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm lg:text-base text-gray-700 mb-2">Job Type</label>
                    <select value={externalJobForm.jobType} onChange={(e)=>handleExternalJobFormChange('jobType', e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-gray-300">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>
              </details>

              <details open className="rounded-xl border border-gray-200">
                <summary className="cursor-pointer select-none px-4 py-3 text-base lg:text-lg font-medium text-gray-800">Submission</summary>
                <div className="p-4 lg:p-6 grid grid-cols-1 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-sm lg:text-base text-gray-700 mb-2">External URL</label>
                    <input type="url" placeholder="https://company.tld/careers/job" value={externalJobForm.externalUrl} onChange={(e)=>handleExternalJobFormChange('externalUrl', e.target.value)} className="w-full border rounded-lg px-4 py-3 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
              </details>
            </div>

            <div className="mt-6 lg:mt-8 flex justify-end gap-4">
              <button onClick={closeAddExternalJobModal} className="px-6 py-3 rounded-lg border hover:bg-gray-50 text-sm lg:text-base">Cancel</button>
              <button onClick={handleAddExternalJob} className="px-8 py-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-sm lg:text-base">Add External Job</button>
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum CGPA (optional)</label>
      <input
        type="number"
        step="0.1"
        min="0"
        max="10"
        placeholder="e.g., 7.0"
        value={newJobPostingForm.minCgpa || ''}
        onChange={(e) => handleNewJobPostingFormChange('minCgpa' as any, e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
                          <p className="text-xs text-gray-500 mt-1">Leave blank if no CGPA requirement.</p>
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
         <div className="fixed inset-0 flex items-start justify-center bg-black/30 backdrop-blur-sm z-50 px-4 pt-8">
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

              {/* Global Send All control */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    onClick={() => setSendAllOpen((v) => !v)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                  >
                    Send All
                  </button>
                  {sendAllOpen && (
                    <div className="flex w-full gap-2">
                      <input
                        type="email"
                        value={sendAllEmail}
                        onChange={(e) => setSendAllEmail(e.target.value)}
                        placeholder="Enter recipient email"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                      <button
                        onClick={async () => {
                          try {
                            const email = sendAllEmail.trim();
                            if (!email) { alert('Enter an email'); return; }
                            const token = getAuth()?.token || '';
                            const jobId = selectedJobForApplications?._id;
                            if (!jobId) { alert('No job selected'); return; }
                            const data = await sendJobApplicationsEmail(token, jobId, email);
                            if (!data.success) throw new Error('Failed to send email');
                            alert(`Sent ${data.sent} applicants to ${email}.`);
                            setSendAllOpen(false);
                            setSendAllEmail('');
                          } catch (e) {
                            alert(e instanceof Error ? e.message : 'Failed to send emails');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => { setSendAllOpen(false); setSendAllEmail(''); }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Applications List */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
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
                          <button
                            onClick={async () => {
                              try {
                                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
                                const direct = application.resumeUrl as string | undefined
                                if (direct) {
                                  const resolved = direct.startsWith('http') ? direct : `${baseUrl}${direct}`
                                  window.open(resolved, '_blank', 'noopener')
                                  return
                                }
                                if (application.studentId) {
                                  // Fallback: fetch active-view JSON, then open its url
                                  const token = getAuth()?.token || ''
                                  const data = await getStudentActiveResumeViewUrl(token, application.studentId)
                                  const viewUrl: string | undefined = data?.url
                                  if (data.success && typeof viewUrl === 'string') {
                                    const resolved = viewUrl.startsWith('http') ? viewUrl : `${baseUrl}${viewUrl}`
                                    window.open(resolved, '_blank', 'noopener')
                                  } else {
                                    alert('Failed to get resume view url')
                                  }
                                  return
                                }
                                alert('No resume URL available for this application')
                              } catch (e: unknown) {
                                alert(e instanceof Error ? e.message : 'Failed to open resume')
                              }
                            }}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Resume
                          </button>
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
