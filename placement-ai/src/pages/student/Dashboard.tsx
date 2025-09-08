import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../../components/layout/Layout'
import CircularProgress from '../../components/ui/circular-progress'
import StatsCard from '../../components/ui/stats-card'
import JobCard from '../../components/ui/job-card'
import { getAuth } from '../../global/auth'
import { getStudentProfile, listJobs, getResumeAnalysis } from '../../global/api'
import { FiFileText, FiClipboard, FiTarget, FiBookOpen } from 'react-icons/fi'

type InternalJob = {
  _id: string
  title: string
  location?: string
  jobType?: string
  ctc?: string
  deadline?: string
  skills?: string[]
  company?: { name?: string; companyDetails?: { companyName?: string } } | string
}

export default function StudentDashboard() {
  const auth = getAuth()
  const [completion, setCompletion] = useState(0)
  const [atsScore, setAtsScore] = useState<number | null>(null)
  const [studentSkills, setStudentSkills] = useState<string[]>([])
  const [jobs, setJobs] = useState<InternalJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) return
      try {
        setLoading(true)
        const [profileRes, jobsRes, resumeAnalysis] = await Promise.all([
          getStudentProfile(auth.token),
          listJobs({ limit: 5 }),
          getResumeAnalysis(auth.token).catch(() => null)
        ])

        if (profileRes?.profile) {
          setCompletion(profileRes.profile.status?.profileCompletion || 0)
          // Prefer current ATS analysis from backend if available
          const latestAts = (resumeAnalysis && (resumeAnalysis as any).resume?.atsAnalysis?.score) ?? null
          if (typeof latestAts === 'number') {
            setAtsScore(latestAts)
          } else {
            const resume = profileRes.profile.resume
            setAtsScore(resume?.atsScore ?? null)
          }
          const skills = profileRes.profile.placementInfo?.skills || []
          setStudentSkills(Array.isArray(skills) ? skills : [])
        }

        const jobItems: InternalJob[] = (jobsRes?.data?.items || jobsRes?.data || []) as any
        setJobs(Array.isArray(jobItems) ? jobItems : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth?.token])

  const mappedJobs = useMemo(() => {
    return jobs.map((j) => {
      const companyName = typeof j.company === 'string' 
        ? j.company 
        : (j.company?.companyDetails?.companyName || j.company?.name || 'Company')
      const type = (j.jobType || 'Full-time') as 'Full-time' | 'Internship' | 'Part-time' | 'Contract'
      const deadline = j.deadline ? new Date(j.deadline).toISOString().slice(0,10) : '—'
      return {
        id: j._id,
        title: j.title,
        company: companyName,
        location: j.location || '—',
        salary: j.ctc || '—',
        match: atsScore ?? 70,
        type,
        deadline,
        tags: j.skills || [],
      }
    })
  }, [jobs, atsScore])

  const eligibleJobsCount = useMemo(() => {
    if (!studentSkills.length) return jobs.length
    const lowerSkills = new Set(studentSkills.map((s) => s.toLowerCase()))
    const eligible = jobs.filter((j) => {
      if (!j.skills || j.skills.length === 0) return true
      return j.skills.some((sk) => lowerSkills.has(String(sk).toLowerCase()))
    })
    return eligible.length
  }, [jobs, studentSkills])

  const atsColor = useMemo(() => {
    const s = atsScore ?? 0
    if (s >= 80) return 'bg-emerald-600'
    if (s >= 60) return 'bg-blue-600'
    if (s >= 40) return 'bg-amber-500'
    return 'bg-red-600'
  }, [atsScore])

  const deadlinesThisWeek = useMemo(() => {
    const now = new Date()
    const in7 = new Date()
    in7.setDate(now.getDate() + 7)
    return jobs
      .filter((j) => j.deadline)
      .filter((j) => {
        const d = new Date(String(j.deadline))
        return d >= now && d <= in7
      })
      .sort((a, b) => new Date(String(a.deadline)).getTime() - new Date(String(b.deadline)).getTime())
      .slice(0, 5)
  }, [jobs])

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Profile completion</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{completion}%</p>
            </div>
            <CircularProgress percentage={completion} size={88} strokeWidth={8} />
          </motion.div>

          <StatsCard icon={<span className="text-white font-bold">ATS</span>} label="ATS score" value={atsScore ?? '—'} color={atsColor} />

          <StatsCard icon={<span className="text-white font-bold">JOB</span>} label="Eligible jobs" value={eligibleJobsCount} color="bg-primary-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Open positions</h3>
              </div>
              <div className="space-y-4">
                {mappedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    {...job}
                    onView={() => {}}
                    onApply={() => {}}
                    onSave={() => {}}
                  />
                ))}
                {!loading && mappedJobs.length === 0 && (
                  <p className="text-sm text-gray-500">No jobs available right now.</p>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h3>
              <div className="space-y-3">
                <button className="w-full btn btn-primary"><FiFileText /> Upload resume</button>
                <button className="w-full btn bg-secondary-800 text-white"><FiClipboard /> Browse jobs</button>
                <button className="w-full btn bg-gradient-to-r from-insta-1 to-insta-4 text-white"><FiTarget /> Practice tests</button>
                <button className="w-full btn bg-primary-500 text-white"><FiBookOpen /> Learn skills</button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deadlines this week</h3>
              <div className="space-y-3">
                {deadlinesThisWeek.map((j) => (
                  <div key={j._id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{j.title}</p>
                      <p className="text-xs text-gray-500 truncate">{new Date(String(j.deadline)).toISOString().slice(0,10)}</p>
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
    </Layout>
  )
}
