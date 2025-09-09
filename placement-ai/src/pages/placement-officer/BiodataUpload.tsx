import { useState, useRef } from 'react'
import { FaUpload, FaDownload, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaUser, FaGraduationCap, FaChartLine } from 'react-icons/fa'
import { bulkUploadBiodata, createBiodataManual, fetchStudentByEmail, type BiodataEntry, type BiodataUploadResponse } from '../../global/api'
import Layout from '../../components/layout/Layout'

export default function BiodataUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<BiodataUploadResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<BiodataEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual entry state
  const [manual, setManual] = useState<BiodataEntry>({
    email: '',
    name: '',
    branch: '',
    section: '',
    rollNumber: '',
    phone: '',
    year: new Date().getFullYear().toString(),
    gender: '',
    dateOfBirth: '',
    address: '',
    gpa: undefined,
    specialization: '',
    skills: [],
    projects: [],
    attendancePercentage: undefined,
    backlogs: undefined,
    academicRequirements: '',
    otherEligibility: '',
    
    // Physical & Personal Details
    bloodGroup: '',
    height: undefined,
    weight: undefined,
    nationality: '',
    religion: '',
    caste: '',
    category: '',
    
    // Family Information
    parentName: '',
    parentPhone: '',
    parentOccupation: '',
    familyIncome: undefined,
    
    // Academic History
    tenthPercentage: undefined,
    twelfthPercentage: undefined,
    diplomaPercentage: undefined,
    entranceExamScore: undefined,
    entranceExamRank: undefined,
    
    // Living & Transportation
    hostelStatus: '',
    transportMode: '',
    
    // Medical Information
    medicalConditions: '',
    allergies: '',
    disabilities: '',
    
    // Skills & Languages
    languagesKnown: [],
    hobbies: [],
    extraCurricularActivities: [],
    sports: [],
    
    // Certifications & Achievements
    technicalCertifications: [],
    nonTechnicalCertifications: [],
    internships: [],
    workshopsAttended: [],
    paperPublications: [],
    patentApplications: undefined,
    startupExperience: undefined,
    leadershipRoles: undefined,
    communityService: undefined,
    
    // Online Presence
    socialMediaPresence: [],
    linkedinProfile: '',
    portfolioWebsite: '',
    githubProfile: '',
    
    // Career Preferences
    expectedSalary: undefined,
    preferredLocation: [],
    willingToRelocate: false,
    
    // Documents & Identity
    passportNumber: '',
    drivingLicense: '',
    vehicleOwnership: false,
    bankAccount: '',
    panCard: '',
    aadharNumber: ''
  })
  const [manualLoading, setManualLoading] = useState(false)
  const [manualMessage, setManualMessage] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const processCSV = async (file: File): Promise<BiodataEntry[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csv = (e.target?.result as string).replace(/\r\n/g, '\n')
          const lines = csv.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          
          console.log('CSV Headers found:', headers)
          
          const data: BiodataEntry[] = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim())
              console.log(`Row ${index + 1} values:`, values)
              
              // Flexible column mapping
              const nameIndex = headers.findIndex(h => h.includes('name'))
              const emailIndex = headers.findIndex(h => h.includes('email'))
              const branchIndex = headers.findIndex(h => h.includes('branch'))
              const sectionIndex = headers.findIndex(h => h.includes('section'))
              const rollNumberIndex = headers.findIndex(h => h.includes('roll') || h.includes('rollnumber'))
              const phoneIndex = headers.findIndex(h => h.includes('phone'))
              const yearIndex = headers.findIndex(h => h.includes('year'))
              const genderIndex = headers.findIndex(h => h.includes('gender'))
              const dobIndex = headers.findIndex(h => h.includes('dob') || h.includes('dateofbirth') || h.includes('birth'))
              const addressIndex = headers.findIndex(h => h.includes('address'))
              const gpaIndex = headers.findIndex(h => h.includes('gpa') || h.includes('cgpa'))
              const specializationIndex = headers.findIndex(h => h.includes('specialization') || h.includes('special'))
              const skillsIndex = headers.findIndex(h => h.includes('skills'))
              const projectsIndex = headers.findIndex(h => h.includes('projects'))
              const attendanceIndex = headers.findIndex(h => h.includes('attendance'))
              const backlogsIndex = headers.findIndex(h => h.includes('backlog'))
              const academicReqIndex = headers.findIndex(h => h.includes('academic') || h.includes('requirement'))
              const otherEligibilityIndex = headers.findIndex(h => h.includes('eligibility') || h.includes('other'))
              
              const result: BiodataEntry = {
                name: nameIndex >= 0 ? values[nameIndex] || '' : '',
                email: emailIndex >= 0 ? values[emailIndex] || '' : '',
                branch: branchIndex >= 0 ? values[branchIndex] || '' : '',
                section: sectionIndex >= 0 ? values[sectionIndex] || '' : '',
                rollNumber: rollNumberIndex >= 0 ? values[rollNumberIndex] || '' : '',
                phone: phoneIndex >= 0 ? values[phoneIndex] || '' : '',
                year: yearIndex >= 0 ? values[yearIndex] || new Date().getFullYear().toString() : new Date().getFullYear().toString(),
                gender: genderIndex >= 0 ? values[genderIndex] || '' : '',
                dateOfBirth: dobIndex >= 0 ? values[dobIndex] || '' : '',
                address: addressIndex >= 0 ? values[addressIndex] || '' : '',
                gpa: gpaIndex >= 0 && values[gpaIndex] ? parseFloat(values[gpaIndex]) : undefined,
                specialization: specializationIndex >= 0 ? values[specializationIndex] || '' : '',
                skills: skillsIndex >= 0 && values[skillsIndex] ? values[skillsIndex].split(';').map(s => s.trim()).filter(s => s) : [],
                projects: projectsIndex >= 0 && values[projectsIndex] ? values[projectsIndex].split(';').map(p => p.trim()).filter(p => p) : [],
                attendancePercentage: attendanceIndex >= 0 && values[attendanceIndex] ? parseFloat(values[attendanceIndex]) : undefined,
                backlogs: backlogsIndex >= 0 && values[backlogsIndex] ? parseInt(values[backlogsIndex]) : undefined,
                academicRequirements: academicReqIndex >= 0 ? values[academicReqIndex] || '' : '',
                otherEligibility: otherEligibilityIndex >= 0 ? values[otherEligibilityIndex] || '' : ''
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
      
      const response = await bulkUploadBiodata(formData)
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

    const report = uploadResult.results
      .map(result => `${result.email},${result.status}${result.status === 'failed' && result.error ? `,${result.error}` : ''}`)
      .join('\n')
    
    const header = 'Email,Status,Error\n'
    const blob = new Blob([header + report], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'biodata_upload_report.csv'
    a.click()
    URL.revokeObjectURL(url)
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
        const student = res.student as Record<string, unknown>
        
        // Helper function to safely get nested values
        const getValue = (path: string, defaultValue: unknown = '') => {
          return path.split('.').reduce((obj: unknown, key: string) => {
            if (obj && typeof obj === 'object' && key in obj) {
              return (obj as Record<string, unknown>)[key]
            }
            return undefined
          }, student) || defaultValue
        }
        
        // Helper function to convert date to YYYY-MM-DD format
        const formatDate = (date: unknown) => {
          if (!date) return ''
          const d = new Date(date as string)
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
        }
        
        setManual(prev => ({
          ...prev,
          // Basic Information
          name: (student.name as string) || prev.name,
          branch: (student.branch as string) || prev.branch,
          section: (student.section as string) || prev.section,
          rollNumber: (student.rollNumber as string) || prev.rollNumber,
          phone: (student.phone as string) || prev.phone,
          year: (student.year as string) || prev.year,
          
          // Personal Details
          gender: (getValue('onboardingData.personalInfo.gender') as string) || prev.gender,
          dateOfBirth: formatDate(getValue('onboardingData.personalInfo.dateOfBirth')) || prev.dateOfBirth,
          address: (getValue('onboardingData.personalInfo.address') as string) || prev.address,
          
          // Academic Information
          gpa: (getValue('onboardingData.academicInfo.gpa') as number) || prev.gpa,
          specialization: (getValue('onboardingData.academicInfo.specialization') as string) || prev.specialization,
          skills: (getValue('onboardingData.academicInfo.skills', []) as string[]) || prev.skills,
          projects: (getValue('onboardingData.academicInfo.projects', []) as string[]) || prev.projects,
          
          // Eligibility Criteria
          attendancePercentage: (getValue('eligibilityCriteria.attendancePercentage') as number) || prev.attendancePercentage,
          backlogs: (getValue('eligibilityCriteria.backlogs') as number) || prev.backlogs,
          academicRequirements: (getValue('eligibilityCriteria.academicRequirements') as string) || prev.academicRequirements,
          otherEligibility: (getValue('eligibilityCriteria.otherEligibility') as string) || prev.otherEligibility,
          
          // Additional comprehensive fields (if available in future updates)
          bloodGroup: (getValue('bloodGroup') as string) || prev.bloodGroup,
          height: (getValue('height') as number) || prev.height,
          weight: (getValue('weight') as number) || prev.weight,
          nationality: (getValue('nationality') as string) || prev.nationality,
          religion: (getValue('religion') as string) || prev.religion,
          caste: (getValue('caste') as string) || prev.caste,
          category: (getValue('category') as string) || prev.category,
          parentName: (getValue('parentName') as string) || prev.parentName,
          parentPhone: (getValue('parentPhone') as string) || prev.parentPhone,
          parentOccupation: (getValue('parentOccupation') as string) || prev.parentOccupation,
          familyIncome: (getValue('familyIncome') as number) || prev.familyIncome,
          tenthPercentage: (getValue('tenthPercentage') as number) || prev.tenthPercentage,
          twelfthPercentage: (getValue('twelfthPercentage') as number) || prev.twelfthPercentage,
          diplomaPercentage: (getValue('diplomaPercentage') as number) || prev.diplomaPercentage,
          entranceExamScore: (getValue('entranceExamScore') as number) || prev.entranceExamScore,
          entranceExamRank: (getValue('entranceExamRank') as number) || prev.entranceExamRank,
          hostelStatus: (getValue('hostelStatus') as string) || prev.hostelStatus,
          transportMode: (getValue('transportMode') as string) || prev.transportMode,
          medicalConditions: (getValue('medicalConditions') as string) || prev.medicalConditions,
          allergies: (getValue('allergies') as string) || prev.allergies,
          disabilities: (getValue('disabilities') as string) || prev.disabilities,
          languagesKnown: (getValue('languagesKnown', []) as string[]) || prev.languagesKnown,
          hobbies: (getValue('hobbies', []) as string[]) || prev.hobbies,
          extraCurricularActivities: (getValue('extraCurricularActivities', []) as string[]) || prev.extraCurricularActivities,
          sports: (getValue('sports', []) as string[]) || prev.sports,
          technicalCertifications: (getValue('technicalCertifications', []) as string[]) || prev.technicalCertifications,
          nonTechnicalCertifications: (getValue('nonTechnicalCertifications', []) as string[]) || prev.nonTechnicalCertifications,
          internships: (getValue('internships', []) as string[]) || prev.internships,
          workshopsAttended: (getValue('workshopsAttended', []) as string[]) || prev.workshopsAttended,
          paperPublications: (getValue('paperPublications', []) as string[]) || prev.paperPublications,
          patentApplications: (getValue('patentApplications') as number) || prev.patentApplications,
          startupExperience: (getValue('startupExperience') as number) || prev.startupExperience,
          leadershipRoles: (getValue('leadershipRoles') as number) || prev.leadershipRoles,
          communityService: (getValue('communityService') as number) || prev.communityService,
          socialMediaPresence: (getValue('socialMediaPresence', []) as string[]) || prev.socialMediaPresence,
          linkedinProfile: (getValue('linkedinProfile') as string) || prev.linkedinProfile,
          portfolioWebsite: (getValue('portfolioWebsite') as string) || prev.portfolioWebsite,
          githubProfile: (getValue('githubProfile') as string) || prev.githubProfile,
          expectedSalary: (getValue('expectedSalary') as number) || prev.expectedSalary,
          preferredLocation: (getValue('preferredLocation', []) as string[]) || prev.preferredLocation,
          willingToRelocate: (getValue('willingToRelocate') as boolean) || prev.willingToRelocate,
          passportNumber: (getValue('passportNumber') as string) || prev.passportNumber,
          drivingLicense: (getValue('drivingLicense') as string) || prev.drivingLicense,
          vehicleOwnership: (getValue('vehicleOwnership') as boolean) || prev.vehicleOwnership,
          bankAccount: (getValue('bankAccount') as string) || prev.bankAccount,
          panCard: (getValue('panCard') as string) || prev.panCard,
          aadharNumber: (getValue('aadharNumber') as string) || prev.aadharNumber,
        }))
        
        // Count how many fields were populated
        const populatedFields = [
          student.name, student.branch, student.section, student.rollNumber, student.phone, student.year,
          getValue('onboardingData.personalInfo.gender'), getValue('onboardingData.personalInfo.dateOfBirth'), getValue('onboardingData.personalInfo.address'),
          getValue('onboardingData.academicInfo.gpa'), getValue('onboardingData.academicInfo.specialization'),
          getValue('eligibilityCriteria.attendancePercentage'), getValue('eligibilityCriteria.backlogs')
        ].filter(value => value && value !== '').length
        
        setManualMessage(`Successfully loaded ${populatedFields} fields from existing student record`)
      } else {
        setManualMessage('No existing record found; please fill all details manually')
      }
    } catch (e: unknown) {
      setManualMessage(e instanceof Error ? e.message : 'Autofill failed')
    } finally {
      setManualLoading(false)
    }
  }

  const handleManualCreate = async () => {
    try {
      setManualMessage(null)
      if (!manual.name || !manual.email || !manual.branch || !manual.rollNumber) {
        setManualMessage('Name, Email, Branch, and Roll Number are required')
        return
      }
      if (!validateEmail(manual.email)) {
        setManualMessage('Enter a valid email')
        return
      }
      setManualLoading(true)
      const res = await createBiodataManual(manual)
      setManualMessage('Biodata saved successfully')
      // Append to results table for visibility
      setUploadResult(prev => ({
        total: (prev?.total || 0) + 1,
        successful: (prev?.successful || 0) + 1,
        failed: prev?.failed || 0,
        errors: prev?.errors || [],
        results: [
          ...(prev?.results || []),
          { email: manual.email, status: 'success', studentId: (res.student as { id?: string })?.id },
        ],
      }))
      // Reset form
      setManual({
        email: '',
        name: '',
        branch: '',
        section: '',
        rollNumber: '',
        phone: '',
        year: new Date().getFullYear().toString(),
        gender: '',
        dateOfBirth: '',
        address: '',
        gpa: undefined,
        specialization: '',
        skills: [],
        projects: [],
        attendancePercentage: undefined,
        backlogs: undefined,
        academicRequirements: '',
        otherEligibility: '',
        
        // Physical & Personal Details
        bloodGroup: '',
        height: undefined,
        weight: undefined,
        nationality: '',
        religion: '',
        caste: '',
        category: '',
        
        // Family Information
        parentName: '',
        parentPhone: '',
        parentOccupation: '',
        familyIncome: undefined,
        
        // Academic History
        tenthPercentage: undefined,
        twelfthPercentage: undefined,
        diplomaPercentage: undefined,
        entranceExamScore: undefined,
        entranceExamRank: undefined,
        
        // Living & Transportation
        hostelStatus: '',
        transportMode: '',
        
        // Medical Information
        medicalConditions: '',
        allergies: '',
        disabilities: '',
        
        // Skills & Languages
        languagesKnown: [],
        hobbies: [],
        extraCurricularActivities: [],
        sports: [],
        
        // Certifications & Achievements
        technicalCertifications: [],
        nonTechnicalCertifications: [],
        internships: [],
        workshopsAttended: [],
        paperPublications: [],
        patentApplications: undefined,
        startupExperience: undefined,
        leadershipRoles: undefined,
        communityService: undefined,
        
        // Online Presence
        socialMediaPresence: [],
        linkedinProfile: '',
        portfolioWebsite: '',
        githubProfile: '',
        
        // Career Preferences
        expectedSalary: undefined,
        preferredLocation: [],
        willingToRelocate: false,
        
        // Documents & Identity
        passportNumber: '',
        drivingLicense: '',
        vehicleOwnership: false,
        bankAccount: '',
        panCard: '',
        aadharNumber: ''
      })
    } catch (e: unknown) {
      setManualMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <Layout
      title="Biodata Upload"
      subtitle="Upload student biodata and eligibility criteria"
    >
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-brand-primary mb-4 flex items-center gap-2">
              <FaUpload aria-hidden="true" />
              Upload CSV File
            </h2>
            
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-brand-secondary rounded-lg p-6 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary"
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
                aria-label="Choose CSV file to upload"
              >
                <FaUpload className="mx-auto text-4xl text-brand-secondary mb-4" aria-hidden="true" />
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
                        <tr className="border-b bg-white">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Branch</th>
                          <th className="text-left p-2">GPA</th>
                          <th className="text-left p-2">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((student, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{student.name}</td>
                            <td className="p-2">{student.email}</td>
                            <td className="p-2">{student.branch}</td>
                            <td className="p-2">{student.gpa || '—'}</td>
                            <td className="p-2">{student.attendancePercentage ? `${student.attendancePercentage}%` : '—'}</td>
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
                  'Upload & Save Biodata'
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-brand-primary mb-4 flex items-center gap-2">
              <FaChartLine />
              Upload Results
            </h2>
            
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

                {/* Results List */}
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
                      {uploadResult?.results?.map((result, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{result.email}</td>
                          <td className="p-2">
                            {result.status === 'success' ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <FaCheckCircle />
                                Success
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600">
                                <FaExclamationTriangle />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-red-600">
                            {result.status === 'failed' ? (result.error || '—') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Download Report Button */}
                <button
                  onClick={downloadReport}
                  className="w-full bg-brand-secondary text-white py-2 rounded-lg hover:bg-brand-primary transition-colors flex items-center justify-center gap-2"
                >
                  <FaDownload />
                  Download Report
                </button>
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
          <h2 className="text-xl font-semibold text-brand-primary mb-2 flex items-center gap-2">
            <FaUser aria-hidden="true" />
            Manual Entry
          </h2>
          <p className="text-sm text-secondary-600 mb-4">Add or edit a single student biodata with live validation and autofill.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Basic Information */}
            <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-accent-200">
              <h3 className="font-semibold text-secondary-800">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Email <span className="text-red-600">*</span></label>
                <div className="flex gap-2">
                  <input 
                    value={manual.email} 
                    onChange={e => setManual({ ...manual, email: e.target.value })} 
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                    placeholder="student@college.edu" 
                  />
                  <button 
                    onClick={handleAutofill} 
                    disabled={manualLoading} 
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-sm"
                  >
                    {manualLoading ? '...' : 'Fill'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-secondary-500">Use an existing student email to fetch available details.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Name <span className="text-red-600">*</span></label>
                <input 
                  value={manual.name} 
                  onChange={e => setManual({ ...manual, name: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="Full name" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Branch <span className="text-red-600">*</span></label>
                <input 
                  value={manual.branch} 
                  onChange={e => setManual({ ...manual, branch: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="CSE / ECE / ..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Section</label>
                <input 
                  value={manual.section} 
                  onChange={e => setManual({ ...manual, section: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="A / B" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Roll Number <span className="text-red-600">*</span></label>
                <input 
                  value={manual.rollNumber} 
                  onChange={e => setManual({ ...manual, rollNumber: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="Roll No" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
                <input 
                  value={manual.phone} 
                  onChange={e => setManual({ ...manual, phone: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="10-digit" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Year</label>
                <input 
                  value={manual.year} 
                  onChange={e => setManual({ ...manual, year: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="2026" 
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-accent-200">
              <h3 className="font-semibold text-secondary-800">Personal Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Gender</label>
                <select 
                  value={manual.gender} 
                  onChange={e => setManual({ ...manual, gender: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Date of Birth</label>
                <input 
                  type="date"
                  value={manual.dateOfBirth} 
                  onChange={e => setManual({ ...manual, dateOfBirth: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Address</label>
                <textarea 
                  value={manual.address} 
                  onChange={e => setManual({ ...manual, address: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  rows={3}
                  placeholder="Full address"
                />
              </div>
            </div>

            {/* Academic & Eligibility */}
            <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-accent-200">
              <h3 className="font-semibold text-secondary-800">Academic & Eligibility</h3>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">GPA/CGPA</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={manual.gpa || ''} 
                  onChange={e => setManual({ ...manual, gpa: e.target.value ? parseFloat(e.target.value) : undefined })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="8.5" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Specialization</label>
                <input 
                  value={manual.specialization} 
                  onChange={e => setManual({ ...manual, specialization: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="AI/ML, Web Dev, etc." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Attendance %</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={manual.attendancePercentage || ''} 
                  onChange={e => setManual({ ...manual, attendancePercentage: e.target.value ? parseFloat(e.target.value) : undefined })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="85" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Backlogs</label>
                <input 
                  type="number"
                  min="0"
                  value={manual.backlogs || ''} 
                  onChange={e => setManual({ ...manual, backlogs: e.target.value ? parseInt(e.target.value) : undefined })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="0" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Skills (comma-separated)</label>
                <input 
                  value={manual.skills?.join(', ') || ''} 
                  onChange={e => setManual({ ...manual, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="JavaScript, Python, React" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Projects (comma-separated)</label>
                <input 
                  value={manual.projects?.join(', ') || ''} 
                  onChange={e => setManual({ ...manual, projects: e.target.value.split(',').map(p => p.trim()).filter(p => p) })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  placeholder="E-commerce App, ML Model" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Academic Requirements</label>
                <textarea 
                  value={manual.academicRequirements} 
                  onChange={e => setManual({ ...manual, academicRequirements: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  rows={2}
                  placeholder="Minimum GPA, specific courses, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Other Eligibility</label>
                <textarea 
                  value={manual.otherEligibility} 
                  onChange={e => setManual({ ...manual, otherEligibility: e.target.value })} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300" 
                  rows={2}
                  placeholder="Additional requirements, certifications, etc."
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-4">
            <button 
              onClick={handleManualCreate} 
              disabled={manualLoading} 
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-subtle"
            >
              {manualLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
              {manualLoading ? 'Saving...' : 'Save Biodata'}
            </button>
            {manualMessage && (
              <span className={`text-sm ${manualMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {manualMessage}
              </span>
            )}
          </div>
        </div>

        {/* CSV Templates */}
        <div className="bg-white rounded-xl p-6 mt-6 shadow-lg">
          <h2 className="text-xl font-semibold text-brand-primary mb-4 flex items-center gap-2">
            <FaGraduationCap />
            CSV Templates
          </h2>
          
          {/* Basic Template */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Basic Template (Essential Fields)</h3>
            <p className="text-gray-600 mb-2">
              Basic template with essential biodata fields (required fields marked with *):
            </p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              Name*,Email*,Branch*,Section,Roll Number*,Phone,Year,Gender,Date of Birth,Address,GPA,Specialization,Skills,Projects,Attendance %,Backlogs,Academic Requirements,Other Eligibility
            </div>
            <div className="mt-3 flex items-center gap-4">
              <a 
                href="/biodata-template.csv" 
                download="biodata-template.csv"
                className="bg-brand-secondary text-white px-3 py-2 rounded-lg hover:bg-brand-primary transition-colors flex items-center gap-2 text-sm"
              >
                <FaDownload />
                Download Basic Template
              </a>
              <span className="text-sm text-gray-500">Essential fields only</span>
            </div>
          </div>

          {/* Comprehensive Template */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Comprehensive Template (All Fields)</h3>
            <p className="text-gray-600 mb-2">
              Comprehensive template with all available biodata fields including personal, family, academic, and career details:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm max-h-32 overflow-y-auto">
              Name*,Email*,Branch*,Section,Roll Number*,Phone,Year,Gender,Date of Birth,Address,GPA,Specialization,Skills,Projects,Attendance %,Backlogs,Academic Requirements,Other Eligibility,Blood Group,Height,Weight,Nationality,Religion,Caste,Category,Parent Name,Parent Phone,Parent Occupation,Family Income,10th Percentage,12th Percentage,Diploma Percentage,Entrance Exam Score,Entrance Exam Rank,Hostel Status,Transport Mode,Medical Conditions,Allergies,Disabilities,Languages Known,Hobbies,Extra Curricular Activities,Sports,Technical Certifications,Non-Technical Certifications,Internships,Workshops Attended,Paper Publications,Patent Applications,Startup Experience,Leadership Roles,Community Service,Social Media Presence,LinkedIn Profile,Portfolio Website,GitHub Profile,Expected Salary,Preferred Location,Willing to Relocate,Passport Number,Driving License,Vehicle Ownership,Bank Account,Pan Card,Aadhar Number
            </div>
            <div className="mt-3 flex items-center gap-4">
              <a 
                href="/comprehensive-biodata-template.csv" 
                download="comprehensive-biodata-template.csv"
                className="bg-brand-primary text-white px-3 py-2 rounded-lg hover:bg-brand-secondary transition-colors flex items-center gap-2 text-sm"
              >
                <FaDownload />
                Download Comprehensive Template
              </a>
              <span className="text-sm text-gray-500">All available fields</span>
            </div>
          </div>

          <div className="text-sm text-gray-500 space-y-1 border-t pt-4">
            <p><strong>General Guidelines:</strong></p>
            <p>• Fields marked with * are required</p>
            <p>• Email addresses must be unique and correspond to existing student accounts</p>
            <p>• Skills, Projects, Languages, Hobbies, etc. should be semicolon-separated (e.g., "JavaScript;Python;React")</p>
            <p>• GPA should be between 0 and 10</p>
            <p>• Attendance percentage should be between 0 and 100</p>
            <p>• Backlogs should be a non-negative number</p>
            <p>• Date of Birth should be in YYYY-MM-DD format</p>
            <p>• Boolean fields (Willing to Relocate, Vehicle Ownership) should be "Yes"/"No" or "true"/"false"</p>
            <p>• Arrays should be semicolon-separated (e.g., "Bangalore;Mumbai;Delhi")</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}