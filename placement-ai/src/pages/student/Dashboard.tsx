import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../../components/layout/Layout'
import CircularProgress from '../../components/ui/circular-progress'
import StatsCard from '../../components/ui/stats-card'
import JobCard from '../../components/ui/job-card'
import { getAuth } from '../../global/auth'
import { getStudentProfile, listJobs, getResumeAnalysis, listResumes, applyToJob, listMyApplications } from '../../global/api'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../global/ui/dialog'
import Button from '../../components/ui/Button'
 
import { FiFileText, FiClipboard, FiTarget, FiBookOpen } from 'react-icons/fi'


type InternalJob = {
  _id: string
  title: string
  location?: string
  jobType?: string
  ctc?: string
  minCtc?: string
  deadline?: string
  skills?: string[]
  company?: { name?: string; companyDetails?: { companyName?: string } } | string
  description?: string
  minCgpa?: number | string
  jdUrl?: string
  studentsRequired?: number
  createdAt?: string
  postedDate?: string
}

export default function StudentDashboard() {
  const auth = getAuth()
  const [completion, setCompletion] = useState(0)
  const [atsScore, setAtsScore] = useState<number | null>(null)
  const [studentSkills, setStudentSkills] = useState<string[]>([])
  const [studentGpa, setStudentGpa] = useState<number>(0)
  const [missingCgpa, setMissingCgpa] = useState<boolean>(false)
  const [jobs, setJobs] = useState<InternalJob[]>([])
  const [loading, setLoading] = useState(true)
  const [applyJobId, setApplyJobId] = useState<string | null>(null)
  const [viewJob, setViewJob] = useState<InternalJob | null>(null)
  const [resumes, setResumes] = useState<Array<{ id: string; originalName?: string; fileName?: string }>>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [applyMsg, setApplyMsg] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [studentName, setStudentName] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)
  const navigate = useNavigate()

  const resolveMinCgpa = (obj: any): number => {
    const raw = obj?.minCgpa ?? obj?.minimumCGPA ?? obj?.minCGPA ?? obj?.formData?.minimumCGPA
    const num = typeof raw === 'number' ? raw : (typeof raw === 'string' && !isNaN(parseFloat(raw)) ? parseFloat(raw) : undefined)
    if (typeof num === 'number') return num
    const desc = obj?.description || ''
    const patterns = [
      /minimum\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /min\.?\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /cgpa\s*(?:>=|at\s*least|minimum\s*of)?\s*(\d+(?:\.\d+)?)/i
    ]
    for (const rx of patterns) {
      const m = rx.exec(desc)
      if (m) {
        const v = parseFloat(m[1])
        if (!isNaN(v)) return v
      }
    }
    return 0
  }



  useEffect(() => {
    const load = async () => {
      if (!auth?.token) return
      try {
        setLoading(true)
        const profileRes = await getStudentProfile(auth.token)

        const rawGpa = (profileRes?.profile?.academicInfo?.gpa) as unknown
        const hasCgpa = rawGpa !== undefined && rawGpa !== null && !isNaN(Number(rawGpa))
        setMissingCgpa(!hasCgpa)

        const skills = profileRes?.profile?.placementInfo?.skills || []
        setStudentSkills(Array.isArray(skills) ? skills : [])
        const gpaSetVal = Number(rawGpa || 0)
        setStudentGpa(isNaN(gpaSetVal) ? 0 : gpaSetVal)

        if (!hasCgpa) {
          setJobs([])
          setAtsScore(null)
          setAppliedIds(new Set())
          return
        }

        const gpaVal = Number(rawGpa)
        // Fetch more jobs to ensure variety and better matching
        // Fetch minimal data first to render quickly; defer secondary calls
        const [jobsRes, myApps] = await Promise.all([
          listJobs({ 
            limit: 8,
            minCgpa: isNaN(gpaVal) ? 0 : gpaVal,
            sort: 'newest',
            status: 'active'
          }),
          listMyApplications(auth.token).catch(() => ({ items: [] }))
        ])

        if (profileRes?.profile) {
          setCompletion(profileRes.profile.status?.profileCompletion || 0)
          // Extract student name from profile
          console.log('Full profile response:', profileRes)
          console.log('Profile basicInfo:', profileRes.profile.basicInfo)
          const name = profileRes.profile.basicInfo?.name || 
                      'Student'
          console.log('Final extracted name:', name)
          setStudentName(name)
          
          // Defer ATS analysis fetch to after first paint
          setTimeout(() => {
            getResumeAnalysis(auth.token)
              .then((ra) => {
                const latest = (ra as any)?.resume?.atsAnalysis?.score
                if (typeof latest === 'number') {
                  setAtsScore(Math.min(latest, 85))
                } else {
                  const resume = profileRes.profile?.resume
                  setAtsScore(typeof (resume as any)?.atsScore === 'number' ? Math.min((resume as any).atsScore, 85) : null)
                }
              })
              .catch(() => {})
          }, 0)
        }

        const jobItems: InternalJob[] = (jobsRes?.data?.items || jobsRes?.data || []) as any
        setJobs(Array.isArray(jobItems) ? jobItems : [])
        try {
          console.log('[CGPA DEBUG:listJobs dashboard] count=', (jobItems || []).length)
          ;(jobItems || []).forEach((it: any, idx: number) => {
            const direct = it?.minCgpa
            const minUpper = it?.minCGPA
            const minimumUpper = it?.minimumCGPA
            const fromForm = it?.formData?.minimumCGPA
            const parsed = (() => {
              const d = it?.description || ''
              const pats = [
                /minimum\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
                /min\.?\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
                /cgpa\s*(?:>=|at\s*least|minimum\s*of)?\s*(\d+(?:\.\d+)?)/i
              ]
              for (const rx of pats) { const m = rx.exec(d); if (m) { const v = parseFloat(m[1]); if (!isNaN(v)) return v } }
              return 0
            })()
            const resolved = resolveMinCgpa(it)
            console.log(`[CGPA DEBUG:list item ${idx}]`, { id: it?._id, title: it?.title, direct, minUpper, minimumUpper, fromForm, parsed, resolved })
          })
        } catch {}
        const ids = new Set<string>((myApps.items || []).map((a: any) => String(a.job?._id || a.job)))
        setAppliedIds(ids)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth?.token, refreshKey])

  const openApply = async (jobId: string) => {
    try {
      setApplyJobId(jobId)
      setApplyMsg(null)
      const token = auth?.token as string
      const l = await listResumes(token)
      const rs = (l?.resumes || []).map(r => ({ id: r.id, originalName: r.originalName, fileName: r.filename as any }))
      setResumes(rs)
      setSelectedResumeId(rs[0]?.id || null)
    } catch (e) {
      setApplyMsg(e instanceof Error ? e.message : 'Failed to load resumes')
    }
  }

  const performApply = async () => {
    if (!applyJobId || !selectedResumeId) {
      setApplyMsg('Please select a resume')
      return
    }
    if (!window.confirm('Submit this application?')) return
    try {
      setSubmitting(true)
      setApplyMsg(null)
      await applyToJob(auth?.token || '', applyJobId, selectedResumeId)
      setApplyMsg('Applied successfully')
      setAppliedIds(prev => new Set<string>([...Array.from(prev), applyJobId]))
      setApplyJobId(null)
    } catch (e) {
      setApplyMsg(e instanceof Error ? e.message : 'Apply failed')
    } finally {
      setSubmitting(false)
    }
  }

  const mappedJobs = useMemo(() => {
    const parseMinCgpa = (desc?: string): number => {
      try {
        if (!desc || typeof desc !== 'string') return 0
        const patterns = [
          /minimum\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
          /min\.?\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
          /cgpa\s*(?:>=|at\s*least|minimum\s*of)?\s*(\d+(?:\.\d+)?)/i
        ]
        for (const rx of patterns) {
          const m = rx.exec(desc)
          if (m && m[1]) {
            const v = parseFloat(m[1])
            if (!isNaN(v) && v >= 0) return v
          }
        }
        return 0
      } catch (error) {
        console.error('Error parsing min CGPA from description:', error)
        return 0
      }
    }
    const resolveMinCgpa = (obj: any): number => {
      try {
        const raw = obj?.minCgpa ?? obj?.minimumCGPA ?? obj?.minCGPA ?? obj?.formData?.minimumCGPA
        const num = typeof raw === 'number' ? raw : (typeof raw === 'string' && !isNaN(parseFloat(raw)) ? parseFloat(raw) : undefined)
        if (typeof num === 'number' && !isNaN(num)) return num
        
        const parsedFromDesc = parseMinCgpa(obj?.description)
        return typeof parsedFromDesc === 'number' && !isNaN(parsedFromDesc) ? parsedFromDesc : 0
      } catch (error) {
        console.error('Error resolving min CGPA:', error)
        return 0
      }
    }
    const formatINR = (s?: string) => {
      if (!s) return '₹ —'
      const t = String(s)
      if (/\$/g.test(t)) return t.replace(/\$/g, '₹')
      if (/^\d[\d,\.]*$/.test(t)) return `₹ ${t}`
      return t.startsWith('₹') ? t : `₹ ${t}`
    }

    // Calculate job match score based on skills and requirements
    const calculateMatchScore = (job: any): number => {
      let score = 50 // Base score
      
      try {
        // CGPA match bonus
        const minCg = resolveMinCgpa(job)
        const validStudentGpa = typeof studentGpa === 'number' && !isNaN(studentGpa) ? studentGpa : 0
        const validMinCg = typeof minCg === 'number' && !isNaN(minCg) ? minCg : 0
        
        if (validStudentGpa >= validMinCg) {
          score += 20
        }
        
        // Skills match bonus
        if (job.skills && Array.isArray(job.skills) && studentSkills.length > 0) {
          const jobSkills = job.skills
            .filter((s: unknown): s is string => typeof s === 'string' && !!s)
            .map((s: string) => s.toLowerCase().trim())
            .filter((s: string) => s.length > 0)
          
          const studentSkillsLower = studentSkills
            .filter((s: unknown): s is string => typeof s === 'string' && !!s)
            .map((s) => s.toLowerCase().trim())
            .filter((s) => s.length > 0)
          
          if (jobSkills.length > 0) {
            const matchingSkills = jobSkills.filter((skill: string) => 
              studentSkillsLower.some((studentSkill: string) => 
                studentSkill.includes(skill) || skill.includes(studentSkill)
              )
            )
            const skillMatchRatio = matchingSkills.length / jobSkills.length
            const skillBonus = Math.round(skillMatchRatio * 30)
            score += isNaN(skillBonus) ? 0 : skillBonus
          }
        }
        
        // Ensure score is a valid number
        const finalScore = Math.min(Math.max(score, 0), 100)
        return isNaN(finalScore) ? 50 : finalScore
        
      } catch (error) {
        console.error('Error calculating match score:', error)
        return 50 // Return base score if calculation fails
      }
    }

    // Filter and sort jobs for better matching and variety
    const eligibleJobs = jobs
      .filter((j) => {
        const minCg = resolveMinCgpa(j)
        return studentGpa >= (minCg || 0)
      })
      .map((j) => {
        const companyName = typeof j.company === 'string' 
          ? j.company 
          : (j.company?.companyDetails?.companyName || j.company?.name || 'Company')
        const type = (j.jobType || 'Full-time') as 'Full-time' | 'Internship' | 'Part-time' | 'Contract'
        const deadline = j.deadline ? (() => {
          try {
            const date = new Date(j.deadline)
            return isNaN(date.getTime()) ? '—' : date.toISOString().slice(0,10)
          } catch {
            return '—'
          }
        })() : '—'
        const matchScore = calculateMatchScore(j)
        
        return {
          id: j._id,
          title: j.title,
          company: companyName,
          location: j.location || '—',
          salary: formatINR(j.ctc || '—'),
          match: typeof matchScore === 'number' && !isNaN(matchScore) ? matchScore : 50,
          type,
          deadline,
          tags: j.skills || [],
          createdAt: j.createdAt || j.postedDate || new Date().toISOString(),
          originalJob: j
        }
      })
      .sort((a, b) => {
        // Sort by match score (highest first), then by date (newest first)
        if (a.match !== b.match) {
          return b.match - a.match
        }
        try {
          const dateA = new Date(a.createdAt || 0)
          const dateB = new Date(b.createdAt || 0)
          return dateB.getTime() - dateA.getTime()
        } catch {
          return 0
        }
      })

    // Add some randomization to show different jobs on each load
    const shuffled = [...eligibleJobs]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Return top jobs with good variety
    return shuffled.slice(0, 5)
  }, [jobs, atsScore, studentGpa, studentSkills])

  const eligibleJobsCount = useMemo(() => {
    if (!studentSkills.length) return jobs.length
    const lowerSkills = new Set(studentSkills.map((s) => s.toLowerCase()))
    const eligible = jobs.filter((j) => {
      if (!j.skills || j.skills.length === 0) return true
      return j.skills.some((sk) => lowerSkills.has(String(sk).toLowerCase()))
    })
    return eligible.length
  }, [jobs, studentSkills])

  

  const deadlinesThisWeek = useMemo(() => {
    const now = new Date()
    const in7 = new Date()
    in7.setDate(now.getDate() + 7)
    return jobs
      .filter((j) => j.deadline)
      .filter((j) => {
        try {
          const d = new Date(String(j.deadline))
          return !isNaN(d.getTime()) && d >= now && d <= in7
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        try {
          const dateA = new Date(String(a.deadline))
          const dateB = new Date(String(b.deadline))
          return dateA.getTime() - dateB.getTime()
        } catch {
          return 0
        }
      })
      .slice(0, 5)
  }, [jobs])

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-5 sm:space-y-6 sm:px-6 lg:px-8 overflow-x-hidden">
        {/* Welcome Message */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg"
        >
          <div className="text-center">
            <div className="mb-3 sm:mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">👋</span>
              </div>
            </div>
            <h1 className="font-brand text-xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 break-words">
              Hi {studentName || 'Student'}!
            </h1>
            <p className="font-brand text-lg sm:text-xl lg:text-2xl text-blue-600 font-semibold">
              Welcome to beyondcampusX
            </p>
            <p className="text-gray-600 mt-3 text-sm sm:text-base">
              Your journey to career success starts here
            </p>
          </div>
        </motion.div>

        {missingCgpa && (
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">Please add your CGPA in your profile to view eligible jobs on the dashboard.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Profile completion</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">{completion}%</p>
            </div>
            <CircularProgress percentage={completion} size={64} strokeWidth={6} />
          </motion.div>

          <StatsCard icon={<span className="text-white font-bold text-sm">ATS</span>} label="ATS score" value={atsScore ?? '—'} color="bg-primary-500" />

          <StatsCard icon={<span className="text-white font-bold text-sm">JOB</span>} label="Eligible jobs" value={eligibleJobsCount} color="bg-primary-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Open positions</h3>
                <button 
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {mappedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    {...job}
                    onView={() => { navigate(`/jobs/${job.id}`) }}
                    onApply={appliedIds.has(job.id) ? undefined : () => { openApply(job.id) }}
                    onSave={() => {}}
                  />
                ))}
                {!loading && mappedJobs.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-sm text-gray-500 mb-2">No matching jobs available right now.</p>
                    <p className="text-xs text-gray-400">Try refreshing or check back later for new opportunities.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h3>
              <div className="space-y-2 sm:space-y-3">
                <button 
                  onClick={() => navigate('/student/profile')}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <FiFileText /> Complete Profile
                </button>
                <button 
                  onClick={() => navigate('/jobs')}
                  className="w-full btn bg-blue-600 text-white flex items-center justify-center gap-2"
                >
                  <FiClipboard /> Browse All Jobs
                </button>
                <button 
                  onClick={() => navigate('/student/my-jobs')}
                  className="w-full btn bg-green-600 text-white flex items-center justify-center gap-2"
                >
                  <FiTarget /> My Applications
                </button>
                <button 
                  onClick={() => navigate('/student/ats-results')}
                  className="w-full btn bg-purple-600 text-white flex items-center justify-center gap-2"
                >
                  <FiBookOpen /> Resume Analysis
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deadlines this week</h3>
              <div className="space-y-2 sm:space-y-3">
                {deadlinesThisWeek.map((j) => (
                  <div key={j._id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="min-w-0 max-w-[70%] sm:max-w-[80%]">
                      <p className="text-sm font-medium text-gray-800 truncate break-words">{j.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {(() => {
                          try {
                            const date = new Date(String(j.deadline))
                            return isNaN(date.getTime()) ? '—' : date.toISOString().slice(0,10)
                          } catch {
                            return '—'
                          }
                        })()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">Due</span>
                  </div>
                ))}
                {!deadlinesThisWeek.length && (
                  <p className="text-sm text-gray-500">No upcoming deadlines this week.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Dialog open={!!applyJobId} onOpenChange={(open) => { if (!open) setApplyJobId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Easy Apply</DialogTitle>
            <DialogDescription className="sr-only">Select a resume and submit your application for the selected job.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Select a resume to submit
            </div>
            <div className="space-y-2">
              {resumes.length === 0 && (
                <div className="text-sm text-gray-500">No resumes found. Please upload a resume first.</div>
              )}
              {resumes.map(r => (
                <label key={r.id} className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="resume" checked={selectedResumeId === r.id} onChange={() => setSelectedResumeId(r.id)} />
                  <span className="text-sm text-gray-800">{r.originalName || r.fileName || 'Resume'}</span>
                </label>
              ))}
            </div>
            {applyMsg && <div className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded">{applyMsg}</div>}
          </div>
          <DialogFooter>
            <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground" onClick={() => setApplyJobId(null)}>Cancel</Button>
            <Button onClick={performApply} disabled={!selectedResumeId || submitting}>{submitting ? 'Applying...' : 'Apply'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewJob} onOpenChange={(open) => { if (!open) setViewJob(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription className="sr-only">Detailed information about the selected job, including requirements.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xl font-semibold text-gray-900">{viewJob?.title}</div>
              <div className="text-gray-600">{typeof viewJob?.company === 'string' ? viewJob?.company : (viewJob?.company?.companyDetails?.companyName || viewJob?.company?.name)}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><span className="font-medium text-gray-700">Location: </span>{viewJob?.location || '—'}</div>
              <div><span className="font-medium text-gray-700">Type: </span>{viewJob?.jobType || '—'}</div>
              <div><span className="font-medium text-gray-700">Deadline: </span>
                {viewJob?.deadline ? (() => {
                  try {
                    const date = new Date(String(viewJob.deadline))
                    return isNaN(date.getTime()) ? '—' : date.toISOString().slice(0,10)
                  } catch {
                    return '—'
                  }
                })() : '—'}
              </div>
              <div><span className="font-medium text-gray-700">Minimum CTC: </span>{(viewJob as any)?.minCtc || '—'}</div>
              <div>
                <span className="font-medium text-gray-700">CGPA Required: </span>
                {(() => {
                  const minCg = resolveMinCgpa(viewJob)
                  return (minCg || 0) > 0 ? String(minCg) : 'Not required'
                })()}
              </div>
              <div><span className="font-medium text-gray-700">Vacancies: </span>{(viewJob as any)?.studentsRequired || '—'}</div>
              <div><span className="font-medium text-gray-700">CTC: </span>{(viewJob?.ctc || '—') as any}</div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Skills Required</div>
              <div className="flex flex-wrap gap-2">
                {(viewJob?.skills || []).length ? (
                  (viewJob?.skills || []).map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">{s}</span>
                  ))
                ) : (
                  <span className="text-gray-500">Not specified</span>
                )}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Description</div>
              <p className="text-gray-700 whitespace-pre-wrap leading-6">{viewJob?.description || 'No description provided.'}</p>
            </div>
            {(() => {
              const raw = (viewJob as any)?.jdUrl ? String((viewJob as any).jdUrl) : ''
              if (!raw) return null
              const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.PROD ? '' : 'http://localhost:5000')
              const provisional = raw.startsWith('/api/resume/view/')
                ? raw
                : (/^https?:\/\//i.test(raw) ? raw : `/api/resume/view/${raw}`)
              const jdSrc = provisional.startsWith('/api/') ? `${apiBase}${provisional}` : provisional
              return (
                <div className="mt-4">
                  <div className="font-medium text-gray-800 mb-2">Job Description (JD)</div>
                  <div className="w-full h-[60vh] border rounded-md overflow-hidden bg-gray-50">
                    <iframe title="JD PDF" src={jdSrc} className="w-full h-full" />
                  </div>
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewJob(null)} className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
