import { useState, useEffect } from 'react'
import { FaEnvelope, FaSpinner, FaFilter, FaDownload, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'
import { sendBulkWelcomeEmailsWithCredentials, sendBulkWelcomeEmailsByEmails } from '../../global/api'
import Layout from '../../components/layout/Layout'

interface Student {
  _id: string
  name: string
  email: string
  branch: string
  section?: string
  rollNumber: string
  year?: string
  course?: string
  programType?: 'UG' | 'PG'
  admissionYear?: string
  phone?: string
  password?: string
}

interface EmailResult {
  email: string
  status: string
  error?: string
}

export default function BatchManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [emailResults, setEmailResults] = useState<EmailResult[] | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [emailProgress, setEmailProgress] = useState<{ current: number; total: number } | null>(null)
  const [batchSize, setBatchSize] = useState<number>(25)
  
  // Filter states
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  
  // Get unique values for filter dropdowns
  const batches = [...new Set(students.map(s => s.admissionYear).filter(Boolean))].sort()
  const branches = [...new Set(students.map(s => s.branch).filter(Boolean))].sort()
  const programs = [...new Set(students.map(s => s.programType).filter(Boolean))].sort()

  // Fetch students data
  useEffect(() => {
    fetchStudents()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = students

    if (selectedBatch) {
      filtered = filtered.filter(s => s.admissionYear === selectedBatch)
    }
    if (selectedBranch) {
      filtered = filtered.filter(s => s.branch === selectedBranch)
    }
    if (selectedProgram) {
      filtered = filtered.filter(s => s.programType === selectedProgram)
    }

    setFilteredStudents(filtered)
  }, [students, selectedBatch, selectedBranch, selectedProgram])

  const fetchStudents = async () => {
    try {
      setIsLoading(true)
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:5000'
      const response = await fetch(`${baseUrl}/api/placement-officer/students?limit=all`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data.items || [])
      } else {
        console.error('Failed to fetch students')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendWelcomeEmails = async () => {
    if (filteredStudents.length === 0) {
      alert('No students selected to send emails to')
      return
    }

    setIsSendingEmails(true)
    setEmailResults(null)
    setEmailProgress({ current: 0, total: filteredStudents.length })
    
    try {
      const allResults: EmailResult[] = []
      const studentsToProcess = [...filteredStudents]
      
      // Process students in batches
      for (let i = 0; i < studentsToProcess.length; i += batchSize) {
        const batch = studentsToProcess.slice(i, i + batchSize)
        setEmailProgress({ current: i, total: filteredStudents.length })
        
        // Try to send with credentials if passwords are available
        const studentsWithPasswords = batch.filter(s => s.password)
        
        let result
        if (studentsWithPasswords.length > 0) {
          const studentsWithCreds = studentsWithPasswords.map(s => ({
            email: s.email,
            password: s.password!,
            name: s.name
          }))
          result = await sendBulkWelcomeEmailsWithCredentials(studentsWithCreds)
        } else {
          // Fallback to sending by emails only
          const studentEmails = batch.map(s => s.email)
          result = await sendBulkWelcomeEmailsByEmails(studentEmails)
        }
        
        allResults.push(...result.results)
        
        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < studentsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      setEmailProgress({ current: filteredStudents.length, total: filteredStudents.length })
      setEmailResults(allResults)
      
      const sentCount = allResults.filter(r => r.status === 'sent').length
      const failCount = allResults.filter(r => r.status !== 'sent').length
      
      if (failCount === 0) {
        alert(`Successfully sent ${sentCount} welcome emails!`)
      } else if (sentCount > 0) {
        alert(`Sent ${sentCount} emails, ${failCount} failed. Check details below.`)
      } else {
        alert('Failed to send welcome emails. Please check details below.')
      }
      
    } catch (error: any) {
      console.error('Error sending emails:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send welcome emails. Please try again.'
      
      if (error.message?.includes('timed out')) {
        errorMessage = 'Email sending timed out. This may be due to a large number of emails. Please try with a smaller batch size or check your internet connection.'
      } else if (error.message?.includes('Network error')) {
        errorMessage = 'Network error occurred. Please check your internet connection and try again.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setIsSendingEmails(false)
      setEmailProgress(null)
    }
  }

  const downloadReport = () => {
    if (!emailResults) return

    const report = emailResults
      .map(result => `${result.email},${result.status}${result.error ? `,${result.error}` : ''}`)
      .join('\n')
    
    const header = 'Email,Status,Error\n'
    const blob = new Blob([header + report], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'welcome_email_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSelectedBatch('')
    setSelectedBranch('')
    setSelectedProgram('')
  }

  if (isLoading) {
    return (
      <Layout title="Batch Management" subtitle="Manage students by batch and send welcome emails">
        <div className="flex items-center justify-center min-h-64">
          <FaSpinner className="animate-spin text-4xl text-brand-primary" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Batch Management" subtitle="Manage students by batch and send welcome emails">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Filters Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-brand-primary">Filter Students</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-brand-secondary hover:text-brand-primary"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Admission Year (Batch)</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All Batches</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">Branch/Department</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">Program Type</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All Programs</option>
                {programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <FaFilter className="inline mr-1" />
              Showing {filteredStudents.length} of {students.length} students
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Email Batch Size:</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
                disabled={isSendingEmails}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-brand-primary">Students List</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-2 text-brand-secondary hover:text-brand-primary text-sm"
              >
                {showPasswords ? <FaEyeSlash /> : <FaEye />}
                {showPasswords ? 'Hide' : 'Show'} Passwords
              </button>
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={sendWelcomeEmails}
                  disabled={isSendingEmails}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSendingEmails ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <FaEnvelope />
                      Send Welcome Emails ({filteredStudents.length})
                    </>
                  )}
                </button>
                
                {filteredStudents.length > 50 && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    ⚠️ Large batch detected. Email sending may take several minutes.
                  </div>
                )}
                
                {emailProgress && (
                  <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    📧 Sending emails... {emailProgress.current} of {emailProgress.total} completed
                    {emailProgress.total > batchSize && (
                      <span className="ml-2 text-xs">
                        (Batch size: {batchSize})
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {emailResults && (
                <button
                  onClick={downloadReport}
                  className="bg-brand-secondary text-white px-6 py-2 rounded-lg hover:bg-brand-primary transition-colors flex items-center gap-2"
                >
                  <FaDownload />
                  Download Email Report
                </button>
              )}

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Branch</th>
                      <th className="text-left p-3 font-medium">Section</th>
                      <th className="text-left p-3 font-medium">Roll Number</th>
                      <th className="text-left p-3 font-medium">Year</th>
                      <th className="text-left p-3 font-medium">Batch</th>
                      <th className="text-left p-3 font-medium">Program</th>
                      {showPasswords && <th className="text-left p-3 font-medium">Password</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{student.name}</td>
                        <td className="p-3">{student.email}</td>
                        <td className="p-3">{student.branch}</td>
                        <td className="p-3">{student.section || '—'}</td>
                        <td className="p-3">{student.rollNumber}</td>
                        <td className="p-3">{student.year || '—'}</td>
                        <td className="p-3">{student.admissionYear || '—'}</td>
                        <td className="p-3">{student.programType || '—'}</td>
                        {showPasswords && (
                          <td className="p-3 font-mono">
                            {student.password ? student.password : '••••••••'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FaFilter className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>No students found matching the selected filters</p>
              <p className="text-sm mt-2">Try adjusting your filter criteria</p>
            </div>
          )}
        </div>

        {/* Email Results */}
        {emailResults && (
          <div className="bg-white rounded-xl p-6 mt-6 shadow-lg">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Email Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {emailResults.filter(r => r.status === 'sent').length}
                </div>
                <div className="text-sm text-green-600">Sent</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {emailResults.filter(r => r.status !== 'sent').length}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{emailResults.length}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {emailResults.map((result, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{result.email}</td>
                      <td className="p-2">
                        {result.status === 'sent' ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <FaCheckCircle />
                            Sent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <FaExclamationTriangle />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-red-600">
                        {result.status !== 'sent' ? (result.error || '—') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
