import React, { useState, useEffect } from 'react'
import { FiUpload, FiEye, FiTrash2, FiEdit, FiSave, FiX, FiImage } from 'react-icons/fi'
import { FaSpinner } from 'react-icons/fa'
import { uploadCollegeLogo, getCollegeLogo, deleteCollegeLogo, updateCollegeName } from '../../global/api'

interface CollegeInfo {
  _id: string
  name: string
  logoUrl?: string
  logoPublicId?: string
  updatedAt: string
}

export default function CollegeLogoManagement() {
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadCollegeInfo()
  }, [])

  const loadCollegeInfo = async () => {
    try {
      setLoading(true)
      const response = await getCollegeLogo()
      if (response.success) {
        setCollegeInfo(response.collegeInfo)
        setEditName(response.collegeInfo.name)
      }
    } catch (error) {
      console.error('Failed to load college info:', error)
      setMessage({ type: 'error', text: 'Failed to load college information' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' })
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file to upload' })
      return
    }

    try {
      setUploading(true)
      setMessage(null)
      
      const formData = new FormData()
      formData.append('logo', selectedFile)
      
      const response = await uploadCollegeLogo(formData)
      if (response.success) {
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' })
        setSelectedFile(null)
        setPreviewUrl(null)
        await loadCollegeInfo()
      } else {
        setMessage({ type: 'error', text: response.error || 'Upload failed' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Failed to upload logo' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!collegeInfo?.logoUrl) return
    
    if (!confirm('Are you sure you want to delete the current logo?')) return

    try {
      setDeleting(true)
      setMessage(null)
      
      const response = await deleteCollegeLogo()
      if (response.success) {
        setMessage({ type: 'success', text: 'Logo deleted successfully!' })
        await loadCollegeInfo()
      } else {
        setMessage({ type: 'error', text: response.error || 'Delete failed' })
      }
    } catch (error) {
      console.error('Delete error:', error)
      setMessage({ type: 'error', text: 'Failed to delete logo' })
    } finally {
      setDeleting(false)
    }
  }

  const handleNameUpdate = async () => {
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'College name cannot be empty' })
      return
    }

    try {
      setUpdating(true)
      setMessage(null)
      
      const response = await updateCollegeName(editName.trim())
      if (response.success) {
        setMessage({ type: 'success', text: 'College name updated successfully!' })
        setIsEditingName(false)
        await loadCollegeInfo()
      } else {
        setMessage({ type: 'error', text: response.error || 'Update failed' })
      }
    } catch (error) {
      console.error('Update error:', error)
      setMessage({ type: 'error', text: 'Failed to update college name' })
    } finally {
      setUpdating(false)
    }
  }

  const cancelEdit = () => {
    setIsEditingName(false)
    setEditName(collegeInfo?.name || '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading college information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* College Information Card */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">College Information</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* College Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College Name</label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter college name"
                  />
                  <button
                    onClick={handleNameUpdate}
                    disabled={updating}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updating ? <FaSpinner className="animate-spin" /> : <FiSave />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-gray-900">{collegeInfo?.name || 'Not set'}</span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <FiEdit />
                  </button>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
              <p className="text-gray-600">
                {collegeInfo?.updatedAt 
                  ? new Date(collegeInfo.updatedAt).toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Current Logo Display */}
        {collegeInfo?.logoUrl && (
          <div className="bg-white rounded-2xl shadow border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Logo</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <img
                  src={collegeInfo.logoUrl}
                  alt="College Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Current logo</p>
                <div className="flex gap-2">
                  <a
                    href={collegeInfo.logoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FiEye /> View Full Size
                  </a>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleting ? <FaSpinner className="animate-spin" /> : <FiTrash2 />}
                    {deleting ? 'Deleting...' : 'Delete Logo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload New Logo */}
        <div className="bg-white rounded-2xl shadow border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {collegeInfo?.logoUrl ? 'Replace Logo' : 'Upload Logo'}
          </h3>
          
          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Logo File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF, SVG. Max size: 5MB
              </p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <FaSpinner className="animate-spin" /> : <FiUpload />}
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </button>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FiImage /> Logo Guidelines
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Use high-quality images with clear, readable text</li>
            <li>• Recommended size: 300x300 pixels or larger</li>
            <li>• Supported formats: JPG, PNG, GIF, SVG</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Logo will be displayed in various sizes throughout the system</li>
            <li>• Ensure logo is appropriate for professional use</li>
          </ul>
        </div>
    </div>
  )
}
