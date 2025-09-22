import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { getCompanyFormLink, submitCompanyForm } from '../global/api';

interface CompanyFormData {
  // Company Information
  companyName: string;
  companyWebsite: string;
  hqLocation: string;
  otherLocations: string;
  industryDomain: string;
  companySize: string;
  companyDescription: string;
  transportFacility: string; // Yes/No
  // Job/Placement Details (legacy single-role; still used when roles length === 0)
  jobTitle: string;
  jobResponsibilities: string;
  minCTC: string;
  maxCTC: string;
  salaryStructure: string;
  jobLocation: string;
  bondDetails: string;
  vacancies: string;
  interviewMode: string; // Online / On-Campus / Off-Campus
  expectedJoiningDate: string;
  employmentType: string; // Internship/Full-time/Both
  // HR/Recruiter Contact Details
  hrName: string;
  hrDesignation: string;
  hrEmail: string;
  hrPhone: string;
  hrLinkedIn: string;
  alternateContact: string;
  // Additional Information
  socialHandles: string;
  jobDescriptionLink: string;
  studentInstructions: string;
  questionsForStudents: string;
  jdDescription: string;
  minimumCGPA?: string;
}

type RoleEntry = {
  jobTitle: string;
  jobResponsibilities: string;
  minCTC: string;
  maxCTC: string;
  salaryStructure: string;
  jobLocation: string;
  bondDetails: string;
  vacancies: string;
  interviewMode: string;
  expectedJoiningDate: string;
  employmentType: string;
  minimumCGPA?: string;
  jdDescription?: string;
  jdFile?: File | null;
};

const CompanyForm: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    companyWebsite: '',
    hqLocation: '',
    otherLocations: '',
    industryDomain: '',
    companySize: '',
    companyDescription: '',
    transportFacility: 'No',
    jobTitle: '',
    jobResponsibilities: '',
    minCTC: '',
    maxCTC: '',
    salaryStructure: '',
    jobLocation: '',
    bondDetails: '',
    vacancies: '',
    interviewMode: 'Online',
    expectedJoiningDate: '',
    employmentType: 'Full-time',
    hrName: '',
    hrDesignation: '',
    hrEmail: '',
    hrPhone: '',
    hrLinkedIn: '',
    alternateContact: '',
    socialHandles: '',
    jobDescriptionLink: '',
    studentInstructions: '',
    questionsForStudents: '',
    jdDescription: '',
    minimumCGPA: ''
  });
  // Legacy single JD (kept for backward compatibility if roles not used)
  const [jdFile, _setJdFile] = useState<File | null>(null);

  // Multi-role entries
  const [roles, setRoles] = useState<RoleEntry[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string>('');
  const [formLinkData, setFormLinkData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addRole = () => {
    setRoles(prev => ([
      ...prev,
      {
        jobTitle: '',
        jobResponsibilities: '',
        minCTC: '',
        maxCTC: '',
        salaryStructure: '',
        jobLocation: '',
        bondDetails: '',
        vacancies: '',
        interviewMode: 'Online',
        expectedJoiningDate: '',
        employmentType: 'Full-time',
        minimumCGPA: '',
        jdDescription: '',
        jdFile: null,
      }
    ]));
  };

  const removeRole = (index: number) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: keyof RoleEntry, value: any) => {
    setRoles(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  // Fetch form link data on component mount
  useEffect(() => {
    const fetchFormLinkData = async () => {
      if (!linkId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getCompanyFormLink(linkId);
        
        if (data.success) {
          setFormLinkData(data.data);
          // Pre-populate some fields from the form link
          setFormData(prev => ({
            ...prev,
            companyName: data.data.companyName
          }));
        } else {
          setError('Form link not found or expired');
        }
      } catch (err) {
        console.error('Error fetching form link data:', err);
        setError('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormLinkData();
  }, [linkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const useRoles = roles.length > 0;
      const payload: any = {
        ...formData,
        linkId,
      };

      if (useRoles) {
        payload.roles = roles.map(r => ({
          jobTitle: r.jobTitle,
          jobResponsibilities: r.jobResponsibilities,
          minCTC: r.minCTC,
          maxCTC: r.maxCTC,
          salaryStructure: r.salaryStructure,
          jobLocation: r.jobLocation,
          bondDetails: r.bondDetails,
          vacancies: r.vacancies,
          interviewMode: r.interviewMode,
          expectedJoiningDate: r.expectedJoiningDate,
          employmentType: r.employmentType,
          minimumCGPA: r.minimumCGPA,
          jdDescription: r.jdDescription,
        }));
      }

      // Collect per-role files (matched by index)
      const roleFiles: (File | undefined)[] = useRoles ? roles.map(r => r.jdFile || undefined) : [];

      const response = await submitCompanyForm(payload, useRoles ? undefined : (jdFile || undefined), roleFiles);

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit form');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Loading Form...</h1>
          <p className="text-gray-600">Please wait while we load the form data.</p>
        </div>
      </div>
    );
  }

  if (error && !formLinkData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Form Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please check the link or contact the placement team for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Form Submitted Successfully!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your job request. Our placement team will review your submission and get back to you soon.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              <strong>Reference ID:</strong> {linkId || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Company Job Request Form</h1>
          </div>
          {formLinkData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                {formLinkData.companyName}
              </h2>
            </div>
          )}
          <p className="text-lg text-gray-600">
            Please fill out this form to submit your job requirements to our placement team.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Website URL</label>
                  <input type="url" value={formData.companyWebsite} onChange={(e) => handleInputChange('companyWebsite', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="https://example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headquarters Location</label>
                  <input type="text" value={formData.hqLocation} onChange={(e) => handleInputChange('hqLocation', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="City, State, Country" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Office Locations</label>
                  <input type="text" value={formData.otherLocations} onChange={(e) => handleInputChange('otherLocations', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Comma-separated" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry/Domain</label>
                  <input type="text" value={formData.industryDomain} onChange={(e) => handleInputChange('industryDomain', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="e.g., IT, Finance" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                  <input type="text" value={formData.companySize} onChange={(e) => handleInputChange('companySize', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Number of employees" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                  <textarea rows={3} value={formData.companyDescription} onChange={(e) => handleInputChange('companyDescription', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Brief about company and culture" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cab/Transport Facility</label>
                  <select value={formData.transportFacility} onChange={(e) => handleInputChange('transportFacility', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Multi-role section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Job/Placement Details
              </h2>
              <p className="text-sm text-gray-600 mb-4">You can add multiple roles/positions. Use the Add Role button below.</p>

              {roles.length === 0 && (
                <div className="mb-4 p-3 rounded-md bg-purple-50 border border-purple-200 text-sm text-purple-900">
                  No roles added yet. You can either fill the legacy single-role section below or click Add Role to create role-specific sections.
                </div>
              )}

              {roles.map((role, idx) => (
                <div key={idx} className="mb-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Role {idx + 1}</h3>
                    <button type="button" className="text-red-600 text-sm" onClick={() => removeRole(idx)}>Remove</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                      <input type="text" required value={role.jobTitle} onChange={(e) => updateRole(idx, 'jobTitle', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="e.g., Software Engineer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Location</label>
                      <input type="text" value={role.jobLocation} onChange={(e) => updateRole(idx, 'jobLocation', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="City, State or Remote" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CTC</label>
                      <input type="text" value={role.minCTC} onChange={(e) => updateRole(idx, 'minCTC', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="e.g., 6 LPA" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum CTC</label>
                      <input type="text" value={role.maxCTC} onChange={(e) => updateRole(idx, 'maxCTC', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="e.g., 12 LPA" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA (optional)</label>
                      <input type="number" min="0" max="10" step="0.01" value={role.minimumCGPA || ''} onChange={(e) => updateRole(idx, 'minimumCGPA', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="e.g., 7.5" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary Structure Details</label>
                      <input type="text" value={role.salaryStructure} onChange={(e) => updateRole(idx, 'salaryStructure', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Fixed + Variable, stipend, etc." />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Role/Responsibilities *</label>
                    <textarea rows={4} required value={role.jobResponsibilities} onChange={(e) => updateRole(idx, 'jobResponsibilities', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Brief responsibilities" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bond/Service Agreement Details</label>
                      <input type="text" value={role.bondDetails} onChange={(e) => updateRole(idx, 'bondDetails', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Vacancies</label>
                      <input type="number" min="1" value={role.vacancies} onChange={(e) => updateRole(idx, 'vacancies', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mode of Interview</label>
                      <select value={role.interviewMode} onChange={(e) => updateRole(idx, 'interviewMode', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300">
                        <option>Online</option>
                        <option>On-Campus</option>
                        <option>Off-Campus</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Joining Date</label>
                      <input type="date" value={role.expectedJoiningDate} onChange={(e) => updateRole(idx, 'expectedJoiningDate', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Internship/Full-time/Both</label>
                      <select value={role.employmentType} onChange={(e) => updateRole(idx, 'employmentType', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300">
                        <option>Internship</option>
                        <option>Full-time</option>
                        <option>Both</option>
                      </select>
                    </div>
                  </div>

                  {/* Per-role JD upload */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Upload JD for this Role</h4>
                    <p className="text-xs text-gray-600 mb-2">Accepted: PDF, DOC, DOCX. Max 5MB.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => updateRole(idx, 'jdFile', e.target.files?.[0] || null)} className="w-full" />
                      <input type="text" placeholder="Optional JD description/instructions" value={role.jdDescription || ''} onChange={(e) => updateRole(idx, 'jdDescription', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-3">
                <button type="button" onClick={addRole} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md">Add Role</button>
              </div>
            </div>

            {/* Legacy single-role section (shown as fallback when no roles added) */}
            {roles.length === 0 && (
              <div className="border-b border-gray-200 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Location</label>
                    <input type="text" value={formData.jobLocation} onChange={(e) => handleInputChange('jobLocation', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="City, State or Remote" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CTC</label>
                    <input type="text" value={formData.minCTC} onChange={(e) => handleInputChange('minCTC', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="e.g., 6 LPA" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum CTC</label>
                    <input type="text" value={formData.maxCTC} onChange={(e) => handleInputChange('maxCTC', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="e.g., 12 LPA" />
                  </div>
                  <div>
                    <label className="block text sm font-medium text-gray-700 mb-1">Minimum CGPA (optional)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={formData.minimumCGPA || ''}
                      onChange={(e) => handleInputChange('minimumCGPA', e.target.value)}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                      placeholder="e.g., 7.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Structure Details</label>
                    <input type="text" value={formData.salaryStructure} onChange={(e) => handleInputChange('salaryStructure', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Fixed + Variable, stipend, etc." />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Role/Responsibilities *</label>
                  <textarea rows={4} required value={formData.jobResponsibilities} onChange={(e) => handleInputChange('jobResponsibilities', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Brief responsibilities" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bond/Service Agreement Details</label>
                    <input type="text" value={formData.bondDetails} onChange={(e) => handleInputChange('bondDetails', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Vacancies</label>
                    <input type="number" min="1" value={formData.vacancies} onChange={(e) => handleInputChange('vacancies', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mode of Interview</label>
                    <select value={formData.interviewMode} onChange={(e) => handleInputChange('interviewMode', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300">
                      <option>Online</option>
                      <option>On-Campus</option>
                      <option>Off-Campus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Joining Date</label>
                    <input type="date" value={formData.expectedJoiningDate} onChange={(e) => handleInputChange('expectedJoiningDate', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internship/Full-time/Both</label>
                    <select value={formData.employmentType} onChange={(e) => handleInputChange('employmentType', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300">
                      <option>Internship</option>
                      <option>Full-time</option>
                      <option>Both</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                Timeline
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Joining Date</label>
                  <input type="date" value={formData.expectedJoiningDate} onChange={(e) => handleInputChange('expectedJoiningDate', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
              </div>
            </div>

            {/* HR/Recruiter Contact Details */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">HR/Recruiter Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HR Name *</label>
                  <input type="text" required value={formData.hrName} onChange={(e) => handleInputChange('hrName', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HR Designation</label>
                  <input type="text" value={formData.hrDesignation} onChange={(e) => handleInputChange('hrDesignation', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HR Email Address *</label>
                  <input type="email" required value={formData.hrEmail} onChange={(e) => handleInputChange('hrEmail', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HR Phone Number *</label>
                  <input type="tel" required value={formData.hrPhone} onChange={(e) => handleInputChange('hrPhone', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL of HR</label>
                  <input type="url" value={formData.hrLinkedIn} onChange={(e) => handleInputChange('hrLinkedIn', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Contact Person (Optional)</label>
                  <input type="text" value={formData.alternateContact} onChange={(e) => handleInputChange('alternateContact', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company’s Social Media Handles</label>
                  <input type="text" value={formData.socialHandles} onChange={(e) => handleInputChange('socialHandles', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="LinkedIn, Twitter, etc." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website Link for Job Description</label>
                  <input type="url" value={formData.jobDescriptionLink} onChange={(e) => handleInputChange('jobDescriptionLink', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Any Additional Instructions for Students</label>
                  <textarea rows={3} value={formData.studentInstructions} onChange={(e) => handleInputChange('studentInstructions', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" placeholder="Documents to carry, dress code, etc." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions or Messages for Students</label>
                  <textarea rows={3} value={formData.questionsForStudents} onChange={(e) => handleInputChange('questionsForStudents', e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Job Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>This form is provided by the Placement Cell for company job requests.</p>
          <p>All information will be kept confidential and used only for placement purposes.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyForm;
