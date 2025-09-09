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
    const companyName = typeof job.company === 'string' ? job.company : (job.company?.companyDetails?.companyName || job.company?.name || 'the company')
    const role = job.title || 'the role'
    const loc = job.location || 'the specified location'
    const jt = job.jobType || 'a suitable employment type'
    const rawCtc = job.ctc ? String(job.ctc).replace(/\$/g, '₹') : ''
    const ctc = rawCtc
      ? (/lpa/i.test(rawCtc) ? rawCtc : `${rawCtc} LPA`)
      : 'a competitive compensation'
    const deadline = job.deadline ? new Date(String(job.deadline)).toLocaleDateString() : 'the posted deadline'
    const skills: string[] = Array.isArray(job.skills) ? job.skills : []
    const minCg = resolveMinCgpa(job)

    lines.push(`${companyName} is hiring for ${role}.`)
    lines.push(`This opportunity is based in ${loc} and is offered as ${jt}.`)
    lines.push(`The compensation for this role is ${ctc}.`)
    if (minCg > 0) {
      lines.push(`Applicants should have an academic CGPA of at least ${minCg}.`)
    } else {
      lines.push('There is no minimum academic CGPA requirement for this role.')
    }
    if (skills.length > 0) {
      lines.push(`The role prefers candidates with skills such as ${skills.join(', ')}.`)
    } else {
      lines.push('Specific skills were not listed; strong fundamentals and relevant experience are valued.')
    }
    lines.push(`Applications are accepted until ${deadline}.`)
    return lines
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
          </div>
        )}
      </div>
    </Layout>
  )
}


