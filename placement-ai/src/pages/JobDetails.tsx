import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { getJob } from '../global/api'

export default function JobDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getJob(id as string)
        const payload: any = (res as any)?.data
        const full = (payload?.job) || (payload?.data?.job) || payload
        setJob(full || null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load job details')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const resolveMinCgpa = (obj: any): number => {
    if (!obj) return 0
    const raw = obj?.minCgpa ?? obj?.minimumCGPA ?? obj?.minCGPA ?? obj?.formData?.minimumCGPA
    const num = typeof raw === 'number' ? raw : (typeof raw === 'string' && !isNaN(parseFloat(raw)) ? parseFloat(raw) : undefined)
    if (typeof num === 'number') return num
    const desc = obj?.description || ''
    const patterns = [
      /minimum\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /min\.?\s*cgpa\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /cgpa\s*(?:>=|at\s*least|minimum\s*of)?\s*(\d+(?:\.\d+)?)/i
    ]
    for (const rx of patterns) { const m = rx.exec(desc); if (m) { const v = parseFloat(m[1]); if (!isNaN(v)) return v } }
    return 0
  }

  const narrative = useMemo(() => {
    if (!job) return [] as string[]
    const lines: string[] = []
    const companyName = typeof job.company === 'string' ? job.company : (job.company?.companyDetails?.companyName || job.company?.name || '')
    const role = job.title || ''
    const loc = (job.location || '').toString().trim()
    const jt = (job.jobType || '').toString().trim()
    const rawCtc = job.ctc ? String(job.ctc).replace(/\$/g, '₹') : ''
    const ctc = rawCtc ? (/lpa/i.test(rawCtc) ? rawCtc : `${rawCtc}`) : ''
    const skills: string[] = Array.isArray(job.skills) ? job.skills : []
    const minCg = resolveMinCgpa(job)

    if (companyName || role) lines.push(`${companyName || 'A company'} is hiring${role ? ` for ${role}` : ''}.`.trim())
    if (loc || jt) lines.push(`${loc ? `Location: ${loc}.` : ''} ${jt ? `Type: ${jt}.` : ''}`.trim())
    if (ctc) lines.push(`Compensation: ${ctc}.`)
    if (minCg > 0) lines.push(`Minimum CGPA: ${minCg}.`)
    if (skills.length > 0) lines.push(`Skills: ${skills.join(', ')}.`)
    return lines.filter(Boolean)
  }, [job])

  return (
    <Layout title="Job Details">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline mb-4">← Back</button>
        {loading ? (
          <div className="text-gray-600">Loading job details...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : !job ? (
          <div className="text-gray-600">Job not found.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
            <p className="text-gray-600 mb-4">{typeof job.company === 'string' ? job.company : (job.company?.companyDetails?.companyName || job.company?.name || '')}</p>

            <div className="space-y-3 text-gray-800 leading-7">
              {narrative.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Full Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description || 'No additional description provided.'}</p>
            </div>

            {(() => {
              const raw = (job?.jdUrl || '').toString()
              if (!raw) return null
              const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.PROD ? '' : 'http://localhost:5000')
              const provisional = raw.startsWith('/api/resume/view/')
                ? raw
                : (/^https?:\/\//i.test(raw) ? raw : `/api/resume/view/${raw}`)
              const jdSrc = provisional.startsWith('/api/') ? `${apiBase}${provisional}` : provisional
              return (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Job Description (JD)</h2>
                <div className="w-full h-[70vh] border rounded-md overflow-hidden">
                  <iframe title="JD PDF" src={jdSrc} className="w-full h-full" />
                </div>
              </div>
              )
            })()}
          </div>
        )}
      </div>
    </Layout>
  )
}


