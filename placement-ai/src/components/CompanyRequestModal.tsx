import React, { useState } from 'react';
import { X, Link, Copy, Check } from 'lucide-react';
import { getAuth } from '../global/auth';
import { createCompanyFormLink } from '../global/api';

interface CompanyRequestForm {
  company: string;
}

interface CompanyRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkGenerated: (linkData: { linkId: string; companyName: string; link: string }) => void;
}

const CompanyRequestModal: React.FC<CompanyRequestModalProps> = ({
  isOpen,
  onClose,
  onLinkGenerated
}) => {
  const [formData, setFormData] = useState<CompanyRequestForm>({
    company: ''
  });

  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isLinkGenerated, setIsLinkGenerated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleInputChange = (field: keyof CompanyRequestForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateLink = async () => {
    if (!formData.company) {
      alert('Please enter company name to generate link');
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = getAuth();
      console.log('Auth data:', auth);
      
      if (!auth?.token) {
        alert('Please login to generate links');
        return;
      }

      console.log('Making request to create company form link for:', formData.company);
      
      const data = await createCompanyFormLink(auth.token, {
        companyName: formData.company
      });

      console.log('Success response:', data);
      
      if (data.success) {
        setGeneratedLink(data.data.link);
        setIsLinkGenerated(true);
        onLinkGenerated(data.data);
      } else {
        throw new Error(data.message || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate link: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({ company: '' });
    setGeneratedLink('');
    setIsLinkGenerated(false);
    setCopied(false);
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">Generate Company Form Link</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Create a form that companies can fill out to submit job requests
        </p>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              placeholder="Enter company name"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Link Generation Section */}
        {!isLinkGenerated ? (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <Link className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Generate Company Form Link</h3>
            </div>
            <p className="text-sm text-blue-600 mb-3">
              Generate a unique link that companies can use to fill out their job request form.
            </p>
            <button
              onClick={generateLink}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <Link className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-sm font-medium text-green-800">Company Form Link Generated</h3>
            </div>
            <p className="text-sm text-green-600 mb-3">
              Share this link with the company to let them fill out the job request form.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 border rounded-md px-3 py-2 text-sm bg-gray-50"
              />
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-green-500 mt-2">
              Label: <strong>{formData.company}</strong>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-between">
          
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRequestModal;
