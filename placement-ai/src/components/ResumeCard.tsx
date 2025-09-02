import React, { useState } from 'react'
import { uploadResume } from '../global/api'

interface ResumeCardProps {
  resume: {
    id: string
    filename: string
    originalName: string
    cloudinaryUrl: string | null
    uploadDate: string
    hasAtsAnalysis: boolean
    atsScore: number
  } | null
  onResumeUpdate: () => void
  token: string
}

const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onResumeUpdate, token }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await uploadResume(file, token)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        onResumeUpdate()
      }, 500)

    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Resume</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Last updated:</span>
          <span className="text-sm font-medium text-gray-700">
            {resume ? formatDate(resume.uploadDate) : 'Never'}
          </span>
        </div>
      </div>

      {resume ? (
        <div className="space-y-4">
          {/* Resume Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📄</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{resume.originalName}</h4>
                <p className="text-sm text-gray-500">Uploaded as: {resume.filename}</p>
              </div>
            </div>
          </div>

          {/* ATS Score */}
          {resume.hasAtsAnalysis && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">ATS Score</h4>
                  <p className="text-sm text-gray-600">Resume optimization score</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{resume.atsScore}</div>
                  <div className="text-sm text-gray-500">/ 100</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
                    {resume.cloudinaryUrl && resume.cloudinaryUrl !== '#' ? (
          <a
            href={resume.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>👁️</span>
                <span>View Resume</span>
              </a>
            ) : (
              <button
                className="flex-1 bg-gray-400 cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2"
                disabled
                title="Resume file not available"
              >
                <span>👁️</span>
                <span>File Not Available</span>
              </button>
            )}
            
            <label className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 cursor-pointer">
              <span>📤</span>
              <span>Update Resume</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📄</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Resume Uploaded</h4>
          <p className="text-gray-500 mb-6">Upload your resume to get started with ATS analysis</p>
          
          <label className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer inline-flex items-center space-x-2">
            <span>📤</span>
            <span>Upload Resume</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeCard
