import { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { getAuth } from '../../global/auth'
import { listMyApplications } from '../../global/api'
import Button from '../../components/ui/Button'

type Application = {
  _id: string
  status: string
  createdAt: string
  job?: { _id: string; title: string; company?: any; location?: string; jobType?: string; ctc?: string }
  resume?: { originalName?: string; fileName?: string }
}

export default function MyJobs() {
  const auth = getAuth()
  const [items, setItems] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await listMyApplications(auth?.token || '')
        setItems((data.items as Application[]) || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    if (auth?.token) load()
  }, [auth?.token])

  return (
    <Layout title="My Applications">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">My Jobs</h2>
          <p className="text-sm text-gray-500">All the jobs you have applied to</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">No applications yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((a) => {
              const title = a.job?.title || 'Job'
              const company = typeof a.job?.company === 'string' ? a.job?.company : (a.job?.company?.companyDetails?.companyName || a.job?.company?.name || 'Company')
              const resumeName = a.resume?.originalName || a.resume?.fileName || 'Resume'
              const created = new Date(a.createdAt).toLocaleString()
              const statusColor = a.status === 'applied' || a.status === 'Pending' ? 'bg-blue-100 text-blue-700' : a.status === 'shortlisted' || a.status === 'Shortlisted' ? 'bg-green-100 text-green-700' : a.status === 'rejected' || a.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.PROD ? '' : 'http://localhost:5000')
              // Attempt to use view URL from backend enrichment, else fallback to signed download
              // @ts-ignore
              const r: any = (a as any).resume || {}
              const viewUrl: string | undefined = r.viewUrl || r.signedViewUrl
              // @ts-ignore
              const resumeId: string | undefined = r.id || r._id
              const downloadUrl = resumeId ? `${baseUrl}/api/resume/${resumeId}/download` : undefined

              return (
                <div key={a._id} className="p-5 border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>{a.status || 'Applied'}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">{company}</p>
                      <div className="mt-2 text-xs text-gray-500 space-x-3">
                        <span>Submitted: {created}</span>
                        <span>•</span>
                        <span>Resume: {resumeName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        onClick={() => {
                          const full = viewUrl ? (viewUrl.startsWith('http') ? viewUrl : `${baseUrl}${viewUrl}`) : downloadUrl
                          if (full) window.open(full, '_blank', 'noopener')
                          else alert('No resume available')
                        }}
                      >
                        View Resume
                      </Button>
                      <Button variant="outline" onClick={() => window.open(`/student/jobs`, '_self')}>Find more jobs</Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}


