import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitOnboarding, analyzeATS, type ATSAnalysis } from '../../global/api'
import { getAuth } from '../../global/auth'
// Full-screen onboarding without app chrome

export default function StudentOnboarding() {
  const navigate = useNavigate()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumePreview, setResumePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysis | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'results'>('upload')
  const [jobRole, setJobRole] = useState('Software Engineer')

  // Load basic user info from auth
  useEffect(() => {
    const auth = getAuth()
    if (!auth?.token) {
      navigate('/login')
    }
  }, [navigate])

  const onDropResume = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    
    // Validate file size (1MB)
    if (f.size > 1 * 1024 * 1024) {
      alert('File size must be less than 1MB. Please compress your resume and try again.')
      return
    }
    
    setResumeFile(f)
    const url = URL.createObjectURL(f)
    setResumePreview(url)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeFile) return

    try {
      setIsUploading(true)
      const auth = getAuth()
      const token = auth?.token as string
      
      // Upload and analyze resume with ATS
      console.log('🚀 Starting resume upload and ATS analysis:', resumeFile.name, resumeFile.size)
      const result = await analyzeATS(resumeFile, token, jobRole)
      
      if (!result?.success) {
        const errorMsg = result?.message || 'Resume analysis failed'
        console.error('❌ Resume analysis failed:', errorMsg)
        alert(`Resume analysis failed: ${errorMsg}`)
        setIsUploading(false)
        return
      }

      console.log('✅ Resume analyzed successfully:', result)
      
      // Set ATS analysis results
      setAtsAnalysis(result.atsAnalysis)
      setCurrentStep('results')

    } catch (err) {
      console.error('❌ Onboarding error:', err)
      setIsUploading(false)
      
      // Better error handling for different types of errors
      let errorMessage = 'An unexpected error occurred'
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid service account credentials')) {
          errorMessage = 'Google Drive service is not properly configured. Please contact support.'
        } else if (err.message.includes('Upload failed')) {
          errorMessage = 'Resume upload failed. Please try again or contact support.'
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }
      
      alert(`Error: ${errorMessage}`)
    }
  }

  const saveAndContinue = async () => {
    try {
      const auth = getAuth()
      const token = auth?.token as string
      
      // Submit minimal onboarding data with ATS score
      await submitOnboarding({
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        resumeUploaded: true,
        resumeLink: 'resume_uploaded',
        atsScore: atsAnalysis?.score || 0,
        jobRole: atsAnalysis?.jobRole || jobRole
      }, token)
      
      // Persist flags so app suppresses onboarding and shows dashboard
      localStorage.setItem('student_onboarded', 'true')
      localStorage.setItem('resume_uploaded', 'true')
      localStorage.setItem('ats_score', String(atsAnalysis?.score || 0))
      
      // Redirect to student dashboard
      navigate('/student')
    } catch (err) {
      console.error('Save error:', err)
      alert(`Error saving: ${(err as Error).message}`)
    }
  }

  if (currentStep === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            {/* Instagram-style gradient circle */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 mx-auto mb-8 flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Rotating dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Analyzing Your Resume
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Our AI is carefully reviewing your resume for ATS optimization...
          </p>
          
          {/* Progress bar */}
          <div className="w-96 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Checking keywords, formatting, and optimization...</p>
            <p className="mt-2">This usually takes a few moments</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === 'results') {
    // Safety check: if atsAnalysis is null, show error state
    if (!atsAnalysis) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Analysis Failed</h1>
              <p className="text-gray-600 mb-6">Something went wrong with the ATS analysis. Please try again.</p>
              <button
                onClick={() => setCurrentStep('upload')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
              ATS Analysis Complete! 🎉
            </h1>
            <p className="text-gray-600 text-lg">Here's your personalized resume analysis for {atsAnalysis.jobRole}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">{atsAnalysis.score}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ATS Score</h3>
              <p className="text-gray-600">
                {atsAnalysis.score >= 80 ? 'Excellent!' : 
                 atsAnalysis.score >= 60 ? 'Good' : 
                 atsAnalysis.score >= 40 ? 'Fair' : 'Needs Improvement'}
              </p>
            </div>

            {/* Keywords Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Key Skills Found</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {atsAnalysis.keywords && atsAnalysis.keywords.length > 0 ? (
                  atsAnalysis.keywords.slice(0, 8).map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No keywords found</span>
                )}
              </div>
            </div>

            {/* Overall Rating */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Overall Rating</h3>
              <p className="text-gray-600">{atsAnalysis.overall}</p>
            </div>
          </div>

          {/* Detailed Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Mistakes */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                Areas to Improve
              </h3>
              <ul className="space-y-3">
                {atsAnalysis.mistakes && atsAnalysis.mistakes.length > 0 ? (
                  atsAnalysis.mistakes.map((mistake, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-400 mr-2 mt-1">•</span>
                      <span className="text-gray-700">{mistake}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 text-sm">No specific areas identified for improvement</li>
                )}
              </ul>
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-green-500 mr-2">💡</span>
                Pro Tips
              </h3>
              <ul className="space-y-3">
                {atsAnalysis.suggestions && atsAnalysis.suggestions.length > 0 ? (
                  atsAnalysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-400 mr-2 mt-1">•</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 text-sm">No specific suggestions available</li>
                )}
              </ul>
            </div>
          </div>

          {/* Detailed Improvements */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Detailed Improvements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Skills */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-blue-500 mr-2">🔧</span>
                  Skills
                </h4>
                <ul className="space-y-2">
                  {atsAnalysis.improvements.skills.map((skill, index) => (
                    <li key={index} className="text-sm text-gray-600">• {skill}</li>
                  ))}
                </ul>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-green-500 mr-2">🔑</span>
                  Keywords
                </h4>
                <ul className="space-y-2">
                  {atsAnalysis.improvements.keywords.map((keyword, index) => (
                    <li key={index} className="text-sm text-gray-600">• {keyword}</li>
                  ))}
                </ul>
              </div>

              {/* Formatting */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-purple-500 mr-2">📝</span>
                  Formatting
                </h4>
                <ul className="space-y-2">
                  {atsAnalysis.improvements.formatting.map((format, index) => (
                    <li key={index} className="text-sm text-gray-600">• {format}</li>
                  ))}
                </ul>
              </div>

              {/* Clarity */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="text-orange-500 mr-2">✨</span>
                  Clarity
                </h4>
                <ul className="space-y-2">
                  {atsAnalysis.improvements.clarity.map((clarity, index) => (
                    <li key={index} className="text-sm text-gray-600">• {clarity}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center">
            <button
              onClick={saveAndContinue}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold rounded-xl text-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Save & Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <header className="max-w-4xl mx-auto px-4 pt-8">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Resume Upload & ATS Analysis
          </h1>
          <p className="text-gray-600 text-center text-lg">
            Upload your resume to get your personalized ATS score and optimization tips
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-4xl">📄</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Upload Your Resume</h2>
              <p className="text-gray-600">We'll analyze your resume using advanced ATS technology</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Job Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Job Role
                </label>
                <select
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UX Designer">UX Designer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                  <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                </select>
              </div>

              {/* Resume Upload Section */}
              <div>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    resumeFile 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-purple-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => { e.preventDefault(); onDropResume(e.dataTransfer.files) }}
                >
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-gray-700 text-lg mb-2">Drag & drop your resume here</p>
                  <p className="text-gray-500 mb-4">or</p>
                  <div>
                    <label className="inline-block px-8 py-4 rounded-xl text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium">
                      Browse Files
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => onDropResume(e.target.files)} />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">Supports PDF, DOC, and DOCX files (max 10MB)</p>
                </div>
                
                {resumePreview && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-900 text-lg">{resumeFile?.name}</p>
                        <p className="text-green-600">Ready for ATS analysis</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button 
                  type="submit" 
                  disabled={!resumeFile || isUploading}
                  className={`px-10 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 ${
                    !resumeFile || isUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing Resume...
                    </span>
                  ) : (
                    'Analyze Resume & Get ATS Score'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Your resume will be analyzed using advanced ATS technology</p>
              <p className="mt-1">Get personalized insights to improve your job applications</p>
            </div>
          </div>
        </div>
      </div>
  );
}


