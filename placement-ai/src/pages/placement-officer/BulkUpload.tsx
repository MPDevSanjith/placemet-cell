import { useState, useRef } from 'react'
import { FaUpload, FaDownload, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import { bulkUploadStudents, fetchStudentByEmail, createStudentManual, downloadBulkStudentsTemplate } from '../../global/api'
import Layout from '../../components/layout/Layout'

interface StudentData {
  name: string
  branch: string
  email: string
  section: string
  rollNumber: string
  phone?: string
  programType?: 'UG' | 'PG'
  admissionYear?: string
  course?: string
  batchRange?: string
}

interface UploadResult {
  total: number
  successful: number
  failed: number
  errors: string[]
  accounts: Array<{
    email: string
    password: string
    status: 'created' | 'failed'
    error?: string
    name?: string
  }>
}

export default function BulkUpload() {
  const [isUploading, setIsUploading] = useState(false)
  
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<StudentData[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual entry state
  const [manual, setManual] = useState<StudentData>({ name: '', email: '', branch: '', section: '', rollNumber: '', phone: '', programType: undefined, admissionYear: '', course: '', batchRange: '' })
  const [manualLoading, setManualLoading] = useState(false)
  const [manualMessage, setManualMessage] = useState<string | null>(null)

  // removed unused generatePassword helper

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // removed unused validateStudentData helper

  const processCSV = async (file: File): Promise<StudentData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csv = (e.target?.result as string).replace(/\r\n/g, '\n')
          const lines = csv.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          
          if (!import.meta.env.PROD) console.log('CSV Headers found:', headers)
          
          const data: StudentData[] = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim())
              if (!import.meta.env.PROD) console.log(`Row ${index + 1} values:`, values)
              
              // More flexible column mapping
              const nameIndex = headers.findIndex(h => h.includes('name'))
              const emailIndex = headers.findIndex(h => h.includes('email'))
              const branchIndex = headers.findIndex(h => h.includes('branch'))
              const sectionIndex = headers.findIndex(h => h.includes('section'))
              const rollNumberIndex = headers.findIndex(h => h.includes('roll') || h.includes('rollnumber'))
              const phoneIndex = headers.findIndex(h => h.includes('phone'))
              const yearIndex = headers.findIndex(h => h === 'year')
              const programTypeIndex = headers.findIndex(h => h.includes('program'))
              const batchIndex = headers.findIndex(h => h.includes('batch'))
              const courseIndex = headers.findIndex(h => h.includes('course'))
              
              const result: StudentData = {
                name: nameIndex >= 0 ? values[nameIndex] || '' : '',
                email: emailIndex >= 0 ? values[emailIndex] || '' : '',
                branch: branchIndex >= 0 ? values[branchIndex] || 'Not Specified' : 'Not Specified',
                section: sectionIndex >= 0 ? values[sectionIndex] || 'Not Specified' : 'Not Specified',
                rollNumber: rollNumberIndex >= 0 ? values[rollNumberIndex] || `ROLL${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : `ROLL${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                phone: phoneIndex >= 0 ? values[phoneIndex] || '' : '',
                // year removed from template; if present in CSV keep it otherwise leave undefined
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                year: yearIndex >= 0 && values[yearIndex] ? values[yearIndex] : undefined,
                programType: programTypeIndex >= 0 ? (values[programTypeIndex] || '') as any : undefined,
                course: (courseIndex >= 0 ? values[courseIndex] : (branchIndex >= 0 ? values[branchIndex] : '')) || '',
                admissionYear: '',
                batchRange: batchIndex >= 0 ? values[batchIndex] || '' : ''
              }

              // If batch is like "2025-2028", set admissionYear from first part
              if (result.batchRange && /\d{4}\s*-\s*\d{4}/.test(result.batchRange)) {
                const start = result.batchRange.split('-')[0].trim()
                result.admissionYear = start
              }
              
              if (!import.meta.env.PROD) console.log(`Row ${index + 1} parsed:`, result)
              return result
            })
          
          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsText(file)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    
    try {
      const data = await processCSV(file)
      setPreviewData(data.slice(0, 5)) // Show first 5 rows as preview
    } catch (error) {
      console.error('Error processing CSV:', error)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file first')
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('csvFile', selectedFile)
      
      const response = await bulkUploadStudents(formData)
      setUploadResult(response)
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadReport = () => {
    if (!uploadResult) return

    const report = uploadResult.accounts
      .map(account => `${account.email},${showPasswords ? account.password : '***'},${account.status}${account.status === 'failed' && account.error ? `,${account.error}` : ''}`)
      .join('\n')
    
    const header = 'Email,Password,Status,Error\n'
    const blob = new Blob([header + report], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk_upload_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Email sending is intentionally removed from Bulk Upload.

  const handleAutofill = async () => {
    try {
      setManualMessage(null)
      if (!manual.email || !validateEmail(manual.email)) {
        setManualMessage('Enter a valid email to autofill')
        return
      }
      setManualLoading(true)
      const res = await fetchStudentByEmail(manual.email)
      if (res.exists && res.student) {
        const s = res.student as Partial<StudentData> | Record<string, any>
        setManual(prev => ({
          ...prev,
          name: (s as any).name || prev.name,
          branch: (s as any).branch || prev.branch,
          section: (s as any).section || prev.section,
          rollNumber: (s as any).rollNumber || prev.rollNumber,
          phone: (s as any).phone || prev.phone,
          course: (s as any).course || prev.course,
        }))
        setManualMessage('Details fetched from existing record')
      } else {
        setManualMessage('No existing record found; please fill details')
      }
    } catch (e: any) {
      setManualMessage(e?.message || 'Autofill failed')
    } finally {
      setManualLoading(false)
    }
  }

  const handleManualCreate = async () => {
    try {
      setManualMessage(null)
      if (!manual.name || !manual.email || !manual.branch || !manual.rollNumber) {
        setManualMessage('Name, Email, Branch, Roll Number are required')
        return
      }
      if (!validateEmail(manual.email)) {
        setManualMessage('Enter a valid email')
        return
      }
      setManualLoading(true)
      // Derive admissionYear from batch range for manual create (best-effort)
      const admissionYear = manual.batchRange && /\d{4}\s*-\s*\d{4}/.test(manual.batchRange) ? manual.batchRange.split('-')[0].trim() : undefined

      const res = await createStudentManual({
        name: manual.name,
        email: manual.email,
        branch: manual.branch,
        section: manual.section || undefined,
        rollNumber: manual.rollNumber,
        phone: manual.phone || undefined,
        year: admissionYear,
      })
      setManualMessage('Student account created successfully')
      // Append to results table for visibility
      setUploadResult(prev => ({
        total: (prev?.total || 0) + 1,
        successful: (prev?.successful || 0) + 1,
        failed: prev?.failed || 0,
        errors: prev?.errors || [],
        accounts: [
          ...(prev?.accounts || []),
          { email: manual.email, password: res.password, status: 'created', name: manual.name },
        ],
      }))
      // Reset minimal fields
      setManual({ name: '', email: '', branch: '', section: '', rollNumber: '', phone: '', programType: undefined, admissionYear: '', course: '', batchRange: '' })
    } catch (e: any) {
      setManualMessage(e?.message || 'Create failed')
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <Layout
      title="Bulk Student Upload"
      subtitle="Upload CSV to create/save student accounts. Send emails later from Batch Management."
    >
      <div className="max-w-6xl mx-auto p-6">

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Upload CSV File</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-brand-secondary rounded-lg p-6 text-center">
                <FaUpload className="mx-auto text-4xl text-brand-secondary mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand-secondary text-white px-4 py-2 rounded-lg hover:bg-brand-primary transition-colors"
                >
                  Choose File
                </button>
                {selectedFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {selectedFile.name} selected
                  </p>
                )}
              </div>

              {previewData.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-brand-primary mb-2">Preview (First 5 rows)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Branch</th>
                          <th className="text-left p-2">Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((student, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{student.name}</td>
                            <td className="p-2">{student.email}</td>
                            <td className="p-2">{student.branch}</td>
                            <td className="p-2">{student.section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full bg-brand-primary text-white py-3 rounded-lg font-medium hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upload & Create Accounts'
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Upload Results</h2>
            
            {uploadResult ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{uploadResult.successful}</div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{uploadResult.total}</div>
                    <div className="text-sm text-blue-600">Total</div>
                  </div>
                </div>

                {/* Password Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Generated Passwords</span>
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="flex items-center gap-2 text-brand-secondary hover:text-brand-primary"
                  >
                    {showPasswords ? <FaEyeSlash /> : <FaEye />}
                    {showPasswords ? 'Hide' : 'Show'} Passwords
                  </button>
                </div>

                {/* Account List */}
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Password</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult?.accounts?.map((account, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{account.name || '—'}</td>
                          <td className="p-2">{account.email}</td>
                          <td className="p-2 font-mono">
                            {showPasswords ? account.password : '••••••••'}
                          </td>
                          <td className="p-2">
                            {account.status === 'created' ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <FaCheckCircle />
                                Created
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600">
                                <FaExclamationTriangle />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-red-600">
                            {account.status === 'failed' ? (account.error || '—') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={downloadReport}
                    className="w-full bg-brand-secondary text-white py-2 rounded-lg hover:bg-brand-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <FaDownload />
                    Save Report (CSV)
                  </button>
                  <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p>✓ Student accounts have been saved successfully.</p>
                    <p className="text-xs mt-1">Send welcome emails later from Batch Management.</p>
                  </div>
                </div>

                {/* Email results removed on Bulk Upload */}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaUpload className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>Upload a CSV file to see results here</p>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-white rounded-xl p-6 mt-6 shadow-lg">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">Manual Entry</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input value={manual.email} onChange={e => setManual({ ...manual, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="student@college.edu" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleAutofill} disabled={manualLoading} className="h-10 px-4 bg-blue-600 text-white rounded-lg disabled:opacity-50">{manualLoading ? 'Fetching...' : 'Autofill'}</button>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input value={manual.name} onChange={e => setManual({ ...manual, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Branch</label>
              <input value={manual.branch} onChange={e => setManual({ ...manual, branch: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="CSE / ECE / ..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Section (optional)</label>
              <input value={manual.section} onChange={e => setManual({ ...manual, section: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="A / B" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Roll Number</label>
              <input value={manual.rollNumber} onChange={e => setManual({ ...manual, rollNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Roll No" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone (optional)</label>
              <input value={manual.phone} onChange={e => setManual({ ...manual, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="10-digit" />
            </div>
            {/* Removed standalone Year field */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Program Type</label>
              <select value={manual.programType || ''} onChange={e => setManual({ ...manual, programType: (e.target.value === '' ? undefined : (e.target.value as 'UG'|'PG')) })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select program</option>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Batch Range</label>
              <input value={manual.batchRange || ''} onChange={e => setManual({ ...manual, batchRange: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="2025-2028" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Course</label>
              <input value={manual.course || ''} onChange={e => setManual({ ...manual, course: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="MCA / BSc / MBA" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={handleManualCreate} disabled={manualLoading} className="px-5 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{manualLoading ? 'Creating...' : 'Create Account'}</button>
            {manualMessage && <span className="text-sm text-gray-700">{manualMessage}</span>}
          </div>
        </div>

        {/* CSV Template */}
        <div className="bg-white rounded-xl p-6 mt-6 shadow-lg">
          <h2 className="text-xl font-semibold text-brand-primary mb-4">CSV Template</h2>
          <p className="text-gray-600 mb-4">
            Your CSV file should include the following columns:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            Name,Email,Branch,Section,Roll Number,Phone,Course,Program Type (free-text),Batch (e.g., 2025-2028)
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>• All fields except Phone are required</p>
            <p>• Email addresses must be unique</p>
            <p>• Passwords will be auto-generated. Emails can be sent later from Batch Management.</p>
          </div>
          <div className="mt-4">
            <button onClick={()=>void downloadBulkStudentsTemplate()} className="px-4 py-2 rounded-lg bg-brand-secondary text-white hover:bg-brand-primary flex items-center gap-2">
              <FaDownload /> Download CSV Template
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
