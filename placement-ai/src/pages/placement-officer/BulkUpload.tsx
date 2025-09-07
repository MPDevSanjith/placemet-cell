import { useState, useRef } from 'react'
import { FaUpload, FaDownload, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEnvelope } from 'react-icons/fa'
import { bulkUploadStudents, sendBulkWelcomeEmailsWithCredentials, sendBulkWelcomeEmailsByEmails, fetchStudentByEmail, createStudentManual } from '../../global/api'
import Layout from '../../components/Layout'

interface StudentData {
  name: string
  branch: string
  email: string
  section: string
  rollNumber: string
  phone?: string
  year?: string
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
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<StudentData[]>([])
  const [emailResults, setEmailResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual entry state
  const [manual, setManual] = useState<StudentData>({ name: '', email: '', branch: '', section: '', rollNumber: '', phone: '', year: '' })
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
          
          console.log('CSV Headers found:', headers)
          
          const data: StudentData[] = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim())
              console.log(`Row ${index + 1} values:`, values)
              
              // More flexible column mapping
              const nameIndex = headers.findIndex(h => h.includes('name'))
              const emailIndex = headers.findIndex(h => h.includes('email'))
              const branchIndex = headers.findIndex(h => h.includes('branch'))
              const sectionIndex = headers.findIndex(h => h.includes('section'))
              const rollNumberIndex = headers.findIndex(h => h.includes('roll') || h.includes('rollnumber'))
              const phoneIndex = headers.findIndex(h => h.includes('phone'))
              const yearIndex = headers.findIndex(h => h.includes('year'))
              
              const result = {
                name: nameIndex >= 0 ? values[nameIndex] || '' : '',
                email: emailIndex >= 0 ? values[emailIndex] || '' : '',
                branch: branchIndex >= 0 ? values[branchIndex] || 'Not Specified' : 'Not Specified',
                section: sectionIndex >= 0 ? values[sectionIndex] || 'Not Specified' : 'Not Specified',
                rollNumber: rollNumberIndex >= 0 ? values[rollNumberIndex] || `ROLL${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : `ROLL${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                phone: phoneIndex >= 0 ? values[phoneIndex] || '' : '',
                year: yearIndex >= 0 ? values[yearIndex] || new Date().getFullYear().toString() : new Date().getFullYear().toString()
              }
              
              console.log(`Row ${index + 1} parsed:`, result)
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

  const sendWelcomeEmails = async () => {
    if (!uploadResult || uploadResult.successful === 0) {
      alert('No successful accounts to send emails to')
      return
    }

    setIsSendingEmails(true)
    
    try {
      // Prefer sending plain credentials from fresh upload
      const studentsWithCreds = uploadResult.accounts
        .filter(account => account.status === 'created' && account.password)
        .map(account => ({ email: account.email, password: account.password, name: account.name }))

      let result
      if (studentsWithCreds.length > 0) {
        result = await sendBulkWelcomeEmailsWithCredentials(studentsWithCreds)
      } else {
        // Fallback to sending by emails only
        const studentEmails = uploadResult.accounts
          .filter(account => account.status === 'created')
          .map(account => account.email)
        result = await sendBulkWelcomeEmailsByEmails(studentEmails)
      }

      setEmailResults({
        success: result.success,
        results: {
          successful: result.results.filter(r => r.status === 'sent').length,
          failed: result.results.filter(r => r.status !== 'sent').length,
          total: result.results.length
        },
        raw: result.results
      })
      const sentCount = result.results.filter(r => r.status === 'sent').length
      const failCount = result.results.filter(r => r.status !== 'sent').length
      if (failCount === 0) {
        alert(`Successfully sent ${sentCount} welcome emails!`)
      } else if (sentCount > 0) {
        alert(`Sent ${sentCount} emails, ${failCount} failed. Check details below.`)
      } else {
        alert('Failed to send welcome emails. Please check details below.')
      }
      
    } catch (error) {
      console.error('Error sending emails:', error)
      alert('Failed to send welcome emails. Please try again.')
    } finally {
      setIsSendingEmails(false)
    }
  }

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
          year: (s as any).year || prev.year,
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
      const res = await createStudentManual({
        name: manual.name,
        email: manual.email,
        branch: manual.branch,
        section: manual.section || undefined,
        rollNumber: manual.rollNumber,
        phone: manual.phone || undefined,
        year: manual.year || undefined,
      })
      setManualMessage('Student created and email sent')
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
      setManual({ name: '', email: '', branch: '', section: '', rollNumber: '', phone: '', year: '' })
    } catch (e: any) {
      setManualMessage(e?.message || 'Create failed')
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <Layout
      title="Bulk Student Upload"
      subtitle="Upload CSV file to create student accounts and send login credentials"
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
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Password</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult?.accounts?.map((account, index) => (
                        <tr key={index} className="border-b">
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
                    onClick={sendWelcomeEmails}
                    disabled={!uploadResult || uploadResult.successful === 0 || isSendingEmails}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSendingEmails ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Sending Emails...
                      </>
                    ) : (
                      <>
                        <FaEnvelope />
                        Send Welcome Emails ({uploadResult?.successful || 0})
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={downloadReport}
                    className="w-full bg-brand-secondary text-white py-2 rounded-lg hover:bg-brand-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <FaDownload />
                    Download Report
                  </button>
                </div>

                {/* Email Results */}
                {emailResults && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Email Results</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{emailResults.results?.successful || 0}</div>
                        <div className="text-green-600">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{emailResults.results?.failed || 0}</div>
                        <div className="text-red-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{emailResults.results?.total || 0}</div>
                        <div className="text-blue-600">Total</div>
                      </div>
                    </div>
                  </div>
                )}
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
          <h2 className="text-xl font-semibold text-brand-primary mb-4">Manual Entry (Email first, then save)</h2>
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
            <div>
              <label className="block text-sm text-gray-700 mb-1">Year (optional)</label>
              <input value={manual.year} onChange={e => setManual({ ...manual, year: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="2026" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={handleManualCreate} disabled={manualLoading} className="px-5 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{manualLoading ? 'Creating...' : 'Create & Send Email'}</button>
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
            Name,Email,Branch,Section,Roll Number,Phone,Year
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>• All fields except Phone and Year are required</p>
            <p>• Email addresses must be unique</p>
            <p>• Passwords will be auto-generated and sent via email</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
