import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { listJobs, getStudentProfile, listResumes, applyToJob, listMyApplications } from '../../global/api'
import { getAuth } from '../../global/auth'
import JobCard from '../../components/ui/job-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../global/ui/dialog'
import Button from '../../components/ui/Button'

type JobItem = {
  _id: string
  company: string
  title: string
  description: string
  location: string
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract'
  ctc?: string
  deadline?: string
  skills?: string[]
  branches?: string[]
}

type ResumeEntry = { id: string; originalName?: string; filename?: string }

export default function StudentJobs() {
  const auth = getAuth()
  const token = auth?.token || ''

  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [profile, setProfile] = useState<null | {
    placementInfo?: { skills?: string[] }
    academicInfo?: { gpa?: number; branch?: string }
  }>(null)
  const [resumes, setResumes] = useState<ResumeEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const [applyJob, setApplyJob] = useState<JobItem | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [onlyMatched, setOnlyMatched] = useState<boolean>(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch profile first to get student CGPA
        const profRes = await getStudentProfile(token)
        const gpa = Number(profRes?.profile?.academicInfo?.gpa || 0)

        const [jobsRes, resList, myApps] = await Promise.all([
          listJobs({ limit: 100, minCgpa: isNaN(gpa) ? 0 : gpa }),
          listResumes(token),
          listMyApplications(token).catch(() => ({ items: [] }))
        ])

        const items: JobItem[] = (jobsRes?.data?.items || jobsRes?.data || []) as JobItem[]
        setJobs(items)
        setProfile(profRes?.profile || null)
        const resumeArr = (resList?.resumes || []).map((r) => ({ id: r.id, originalName: r.originalName, filename: r.filename }))
        setResumes(resumeArr)
        const ids = new Set<string>((myApps.items || []).map((a: any) => String(a.job?._id || a.job)))
        setAppliedIds(ids)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token])

  const studentSkills = useMemo(() => (profile?.placementInfo?.skills || []).map((s) => s.toLowerCase().trim()), [profile])
  const studentCgpa = profile?.academicInfo?.gpa || 0
  const studentBranch = profile?.academicInfo?.branch || ''

  const computeMatch = (job: JobItem): number => {
    const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim())
    const total = jobSkills.length || 1
    const matched = jobSkills.filter((s) => studentSkills.includes(s)).length
    let score = Math.round((matched / total) * 80)
    // Simple branch signal
    if (!job.branches || job.branches.length === 0 || job.branches.includes('All') || job.branches.includes(studentBranch)) {
      score += 10
    }
    // Simple GPA signal (if job description includes min CGPA pattern, otherwise give small bonus)
    const minMatch = /cgpa\s*(\d+(?:\.\d+)?)/i.exec(job.description || '')
    const minCg = minMatch ? parseFloat(minMatch[1]) : 0
    if (studentCgpa >= (isNaN(minCg) ? 0 : minCg)) score += 10
    return Math.max(0, Math.min(100, score))
  }
  const parseMinCgpa = (job: JobItem): number => {
    const desc = job.description || ''
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

  // Note: We intentionally don't hard-filter by eligibility here to match Dashboard behavior

  const openApply = (job: JobItem) => {
    setApplyJob(job)
    setSelectedResumeId(resumes[0]?.id || null)
    setMessage(null)
  }

  const performApply = async () => {
    if (!applyJob || !selectedResumeId) {
      setMessage('Please select a resume')
      return
    }
    if (!window.confirm('Submit this application?')) return
    try {
      setSubmitting(true)
      setMessage(null)
      await applyToJob(token, applyJob._id, selectedResumeId)
      setMessage('Applied successfully')
      setApplyJob(null)
      setAppliedIds(prev => new Set<string>([...Array.from(prev), applyJob._id]))
    } catch (e: unknown) {
      // Fallback UX if endpoint missing
      setMessage(e instanceof Error ? e.message : 'Apply failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Jobs for You">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Recommended Jobs</h2>
        </div>

        <div className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or company"
            className="h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={onlyMatched} onChange={(e) => setOnlyMatched(e.target.checked)} />
            <span>Only show well-matched (60%+)</span>
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-500">Loading jobs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs
              .filter((j) => !typeFilter || j.jobType === typeFilter)
              .map((j) => ({ job: j, match: computeMatch(j) }))
              .filter(({ job, match }) => {
                const q = search.trim().toLowerCase()
                const companyName = typeof job.company === 'string' ? job.company : ((job as any).company?.companyDetails?.companyName || (job as any).company?.name || '')
                const text = `${job.title} ${companyName}`.toLowerCase()
                const passSearch = !q || text.includes(q)
                const passMatch = !onlyMatched || match >= 60
                const minField = (job as any).minCgpa
                const minCg = typeof minField === 'number' 
                  ? minField 
                  : (typeof minField === 'string' && !isNaN(parseFloat(minField))
                      ? parseFloat(minField)
                      : parseMinCgpa(job))
                const passCg = studentCgpa >= minCg
                return passSearch && passMatch && passCg
              })
              .sort((a, b) => b.match - a.match)
              .map(({ job, match }) => (
                <JobCard
                  key={job._id}
                  id={job._id}
                  title={job.title}
                  company={typeof job.company === 'string' ? job.company : ((job as any).company?.companyDetails?.companyName || (job as any).company?.name || 'Company')}
                  location={job.location}
                  salary={(job.ctc || '—').replace(/\$/g, '₹')}
                  match={match}
                  type={job.jobType}
                  deadline={job.deadline || '—'}
                  tags={(job.skills || []).slice(0, 6)}
                  onApply={appliedIds.has(job._id) ? undefined : () => openApply(job)}
                  onView={() => { /* could open details */ }}
                />
              ))}
          </div>
        )}
      </div>

      <Dialog open={!!applyJob} onOpenChange={(open) => { if (!open) setApplyJob(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Easy Apply</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Select a resume to apply for <span className="font-medium text-gray-900">{applyJob?.title}</span>
            </div>

            <div className="space-y-2">
              {resumes.length === 0 && (
                <div className="text-sm text-gray-500">No resumes found. Please upload a resume first.</div>
              )}
              {resumes.map((r) => (
                <label key={r.id} className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="resume"
                    checked={selectedResumeId === r.id}
                    onChange={() => setSelectedResumeId(r.id)}
                  />
                  <span className="text-sm text-gray-800">{r.originalName || r.filename || 'Resume'}</span>
                </label>
              ))}
            </div>

            {message && <div className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded">{message}</div>}
          </div>
          <DialogFooter>
            <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground" onClick={() => setApplyJob(null)}>Cancel</Button>
            <Button onClick={performApply} disabled={!selectedResumeId || submitting}>
              {submitting ? 'Applying...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}


