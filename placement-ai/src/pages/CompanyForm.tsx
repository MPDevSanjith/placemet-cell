import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building, Users, Calendar, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';

interface CompanyFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  jobTitle: string;
  jobDescription: string;
  requirements: string;
  location: string;
  jobType: string;
  salaryRange: string;
  studentsRequired: number;
  minimumCGPA: number;
  startDate: string;
  endDate: string;
  additionalInfo: string;
}

const CompanyForm: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    jobTitle: '',
    jobDescription: '',
    requirements: '',
    location: '',
    jobType: 'Full-time',
    salaryRange: '',
    studentsRequired: 1,
    minimumCGPA: 0,
    startDate: '',
    endDate: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string>('');
  const [formLinkData, setFormLinkData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleInputChange = (field: keyof CompanyFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch form link data on component mount
  useEffect(() => {
    const fetchFormLinkData = async () => {
      if (!linkId) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/companies/form-links/${linkId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setFormLinkData(data.data);
            // Pre-populate some fields from the form link
            setFormData(prev => ({
              ...prev,
              companyName: data.data.companyName,
              jobTitle: data.data.jobRole,
              jobDescription: data.data.description || '',
              studentsRequired: data.data.studentsRequired || 1,
              minimumCGPA: data.data.minimumCGPA || 0,
              startDate: data.data.startDate || '',
              endDate: data.data.endDate || ''
            }));
          }
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/companies/requests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          linkId,
          submittedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
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
                {formLinkData.companyName} - {formLinkData.jobRole}
              </h2>
              {formLinkData.description && (
                <p className="text-blue-600">{formLinkData.description}</p>
              )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Job Details
              </h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="e.g., Bangalore, Remote"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type *
                  </label>
                  <select
                    required
                    value={formData.jobType}
                    onChange={(e) => handleInputChange('jobType', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={formData.salaryRange}
                    onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="e.g., 6-12 LPA"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements & Skills
                </label>
                <textarea
                  rows={3}
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="List the required skills, technologies, experience level, etc."
                />
              </div>
            </div>

            {/* Student Requirements */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                Student Requirements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Students Required *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.studentsRequired}
                    onChange={(e) => handleInputChange('studentsRequired', parseInt(e.target.value))}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum CGPA *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.minimumCGPA}
                    onChange={(e) => handleInputChange('minimumCGPA', parseFloat(e.target.value))}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="e.g., 7.5"
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                Timeline
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Any additional details or special requirements
                </label>
                <textarea
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Any other information you'd like to share with our placement team..."
                />
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
