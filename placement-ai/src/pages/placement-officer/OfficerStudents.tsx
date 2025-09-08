import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { listOfficerStudents, bulkOfficerStudentAction, getStudentActiveResumeViewUrl, type OfficerStudent } from '../../global/api'
import { getAuth } from '../../global/auth'
import { listStudentResumesForOfficer } from '../../global/api'
import { FiEye, FiUser, FiMail, FiBookOpen, FiAward, FiHash, FiGrid, FiCalendar, FiCheckCircle } from 'react-icons/fi'

type Filters = {
  q?: string
  batch?: string
  course?: string
  year?: string
  department?: string
  section?: string
  placed?: string
  blocked?: string
  page?: number
  limit?: number
}

export default function OfficerStudents() {
  const [filters, setFilters] = useState<Filters>({ page: 1, limit: 10 })
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<OfficerStudent[]>([])
  const [total, setTotal] = useState(0)
  const [metrics, setMetrics] = useState({ total: 0, placed: 0, blocked: 0, active: 0 })
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<{ open: boolean; student?: OfficerStudent }>(() => ({ open: false }))
  const [message, setMessage] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [resumeLoadingId, setResumeLoadingId] = useState<string | null>(null)
  const [resumeLists, setResumeLists] = useState<Record<string, Array<{ id: string; name: string; url?: string }>>>({})
  const [resumeSelected, setResumeSelected] = useState<Record<string, string>>({})
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    select: true,
    eye: true,
    name: true,
    rollNumber: true,
    branch: true,
    course: true,
    year: true,
    section: true,
    attendance: true,
    backlogs: true,
    status: true,
    placement: true,
    updatedAt: true,
    actions: true,
  })
  const [confirmDlg, setConfirmDlg] = useState<{open: boolean; action?: 'block'|'unblock'|'place'|'unplace'; ids: string[]}>({ open: false, ids: [] })
  const [searchDraft, setSearchDraft] = useState<string>('')

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected])
  const hasSelection = selectedIds.length > 0

  const load = async () => {
    try {
      setLoading(true)
      const res = await listOfficerStudents(filters)
      setItems(res?.items ?? [])
      setTotal(res?.total ?? 0)
      const activeMetric = (res && 'metrics' in res && (res as { metrics: { active?: number } }).metrics.active) || 0
      setMetrics(res?.metrics ? { total: res.metrics.total||0, placed: res.metrics.placed||0, blocked: res.metrics.blocked||0, active: activeMetric } : { total: 0, placed: 0, blocked: 0, active: 0 })
      // reset selections on new data
      setSelected({})
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.batch, filters.course, filters.year, filters.department, filters.section, filters.placed, filters.blocked])

  // Debounce global search (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, q: searchDraft, page: 1 }))
    }, 300)
    return () => clearTimeout(t)
  }, [searchDraft])

  const toggleAll = (checked: boolean) => {
    const map: Record<string, boolean> = {}
    items.forEach(s => { map[s._id] = checked })
    setSelected(map)
  }

  const doBulk = async (action: 'block'|'unblock'|'place'|'unplace', ids: string[]) => {
    if (ids.length === 0) {
      setMessage('Select at least one student to perform this action')
      return
    }
    try {
      setLoading(true)
      const res = await bulkOfficerStudentAction(action, ids)
      setMessage(`Success: ${res.updated} student(s) ${action === 'block' ? 'blocked' : action === 'unblock' ? 'unblocked' : action === 'place' ? 'marked placed' : 'marked unplaced'}`)
      await load()
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedItems = useMemo(() => {
    const arr = [...items]
    arr.sort((a, b) => {
      const aRecord = a as Record<string, unknown>
      const bRecord = b as Record<string, unknown>
      const av = aRecord[sortKey]
      const bv = bRecord[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av ?? '').localeCompare(String(bv ?? '')) : String(bv ?? '').localeCompare(String(av ?? ''))
    })
    return arr
  }, [items, sortKey, sortDir])

  const viewResume = async (studentId: string) => {
    try {
      setResumeLoadingId(studentId)
      // Officers are authenticated via JWT as user type; token is included by request helper in credentials
      // Here we directly call API with token stored in auth.ts if needed; but global fetch uses cookie/session
      // We'll try without token management as other calls do.
      const auth = getAuth()
      const res = await getStudentActiveResumeViewUrl(auth?.token || '', studentId)
      if (res?.success && res.url) {
        window.open(res.url, '_blank', 'noopener')
      } else {
        setMessage('No active resume found for this student')
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Failed to open resume')
    } finally {
      setResumeLoadingId(null)
    }
  }

  const loadResumes = async (studentId: string) => {
    try {
      setResumeLoadingId(studentId)
      const auth = getAuth()
      const data = await listStudentResumesForOfficer(auth?.token || '', studentId)
      const entries = (data.resumes || []).map(r => ({ id: r.id, name: r.originalName || r.fileName || `Resume ${new Date(r.uploadDate).toLocaleDateString()}`, url: r.viewUrl }))
      setResumeLists(m => ({ ...m, [studentId]: entries }))
      if (entries.length > 0) {
        setResumeSelected(s => ({ ...s, [studentId]: entries[0].id }))
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Failed to load resumes')
    } finally {
      setResumeLoadingId(null)
    }
  }

  const openSelectedResume = (studentId: string) => {
    const selId = resumeSelected[studentId]
    const list = resumeLists[studentId] || []
    const found = list.find(r => r.id === selId)
    if (found?.url) {
      window.open(found.url, '_blank', 'noopener')
    } else {
      setMessage('Selected resume has no view URL')
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', value: metrics.total, gradient: 'from-blue-500 to-indigo-600', icon: '📚', bg: 'from-blue-50 to-indigo-50' },
            { label: 'Active', value: metrics.active, gradient: 'from-sky-500 to-cyan-600', icon: '✅', bg: 'from-sky-50 to-cyan-50' },
            { label: 'Placed', value: metrics.placed, gradient: 'from-emerald-500 to-teal-600', icon: '🎯', bg: 'from-emerald-50 to-teal-50' },
            { label: 'Blocked', value: metrics.blocked, gradient: 'from-rose-500 to-orange-500', icon: '⛔', bg: 'from-rose-50 to-orange-50' }
          ].map((m)=> (
            <div key={m.label} className={`relative overflow-hidden bg-gradient-to-br ${m.bg} rounded-2xl p-5 border border-gray-100 shadow-sm`}>
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${m.gradient} opacity-10`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">{m.label}</div>
                  <div className="text-3xl font-extrabold text-gray-900 mt-1">{m.value}</div>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${m.gradient} shadow`}>
                  <span className="text-xl">{m.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 shadow border mb-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-3">
            <input placeholder="Search by name or roll no" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={searchDraft} onChange={e=>setSearchDraft(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ setFilters(f=>({...f,q: searchDraft, page:1})) } if(e.key==='Escape'){ setSearchDraft(''); setFilters(f=>({ ...f, q: '', page:1 })) } }} />
            <input placeholder="Batch" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.batch||''} onChange={e=>setFilters(f=>({...f,batch:e.target.value,page:1}))} />
            <input placeholder="Course" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.course||''} onChange={e=>setFilters(f=>({...f,course:e.target.value,page:1}))} />
            <input placeholder="Year" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.year||''} onChange={e=>setFilters(f=>({...f,year:e.target.value,page:1}))} />
            <input placeholder="Department" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.department||''} onChange={e=>setFilters(f=>({...f,department:e.target.value,page:1}))} />
            <input placeholder="Section" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.section||''} onChange={e=>setFilters(f=>({...f,section:e.target.value,page:1}))} />
            <select className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.placed||''} onChange={e=>setFilters(f=>({...f,placed:e.target.value,page:1}))}>
              <option value="">Placement Status</option>
              <option value="true">Placed</option>
              <option value="false">Not Placed</option>
            </select>
            <select className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.blocked||''} onChange={e=>setFilters(f=>({...f,blocked:e.target.value,page:1}))}>
              <option value="">Block Status (All)</option>
              <option value="false">Active</option>
              <option value="true">Blocked</option>
            </select>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-lg border hover:bg-gray-50" onClick={()=> setFilters({ page:1, limit: filters.limit })}>Clear Filters</button>
            </div>
          </div>
          {/* Applied filter chips */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {filters.q ? (
              <button className="px-2 py-1 rounded-full border" onClick={()=>setFilters(f=>({ ...f, q: '', page:1 }))}>q: {filters.q} ✕</button>
            ) : null}
            {filters.blocked ? (
              <button className="px-2 py-1 rounded-full border" onClick={()=>setFilters(f=>({ ...f, blocked: undefined, page:1 }))}>blocked: {filters.blocked} ✕</button>
            ) : null}
            {filters.placed ? (
              <button className="px-2 py-1 rounded-full border" onClick={()=>setFilters(f=>({ ...f, placed: undefined, page:1 }))}>placed: {filters.placed} ✕</button>
            ) : null}
            {filters.course ? (
              <button className="px-2 py-1 rounded-full border" onClick={()=>setFilters(f=>({ ...f, course: undefined, page:1 }))}>course: {filters.course} ✕</button>
            ) : null}
            {filters.department ? (
              <button className="px-2 py-1 rounded-full border" onClick={()=>setFilters(f=>({ ...f, department: undefined, page:1 }))}>dept: {filters.department} ✕</button>
            ) : null}
            {filters.section ? (
              <button className="px-2 py-1 rounded-full border" onClick={()=>setFilters(f=>({ ...f, section: undefined, page:1 }))}>section: {filters.section} ✕</button>
            ) : null}
            {filters.year ? (
              <button className="px-2 py-1 rounded-full border" onClick={()=>setFilters(f=>({ ...f, year: undefined, page:1 }))}>year: {filters.year} ✕</button>
            ) : null}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white rounded-2xl p-4 shadow border mb-4 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            <button disabled={!hasSelection} onClick={()=>setConfirmDlg({ open: true, action: 'block', ids: selectedIds })} className={`px-3 py-2 rounded-lg border bg-status-danger text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Block
            </button>
            <button disabled={!hasSelection} onClick={()=>setConfirmDlg({ open: true, action: 'unblock', ids: selectedIds })} className={`px-3 py-2 rounded-lg border bg-status-success text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Unblock
            </button>
            <button disabled={!hasSelection} onClick={()=>setConfirmDlg({ open: true, action: 'place', ids: selectedIds })} className={`px-3 py-2 rounded-lg border bg-status-success text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Mark Placed
            </button>
            <button disabled={!hasSelection} onClick={()=>setConfirmDlg({ open: true, action: 'unplace', ids: selectedIds })} className={`px-3 py-2 rounded-lg border bg-status-warning text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Mark Unplaced
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>setColumnsOpen(o=>!o)} className="px-3 py-2 rounded-lg border text-gray-800 hover:bg-gray-50">Columns</button>
            <div className="text-sm text-gray-600">Selected: {selectedIds.length}</div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {confirmDlg.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setConfirmDlg({ open: false, ids: [] })} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h4>
              <p className="text-sm text-gray-600 mb-4">Are you sure you want to {confirmDlg.action} {confirmDlg.ids.length} selected student(s)?</p>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setConfirmDlg({ open: false, ids: [] })} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button onClick={()=>{ if (confirmDlg.action) { void doBulk(confirmDlg.action, confirmDlg.ids) } setConfirmDlg({ open: false, ids: [] }) }} className="px-4 py-2 rounded-lg text-white bg-brand-primary hover:bg-brand-accent">Confirm</button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Column visibility popover */}
        {columnsOpen && (
          <div className="relative">
            <div className="absolute right-0 z-20 bg-white border rounded-2xl shadow p-4 grid grid-cols-2 gap-2">
              {Object.keys(visibleCols).map(key => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={visibleCols[key]} onChange={e=>setVisibleCols(m=>({...m,[key]: e.target.checked}))} />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {visibleCols.select && (
                  <th className="p-3 border-b w-10"><input type="checkbox" onChange={e=>toggleAll(e.target.checked)} /></th>
                )}
               
                {visibleCols.name && (
                  <th className="p-3 border-b text-left cursor-pointer" onClick={()=>toggleSort('name')}>Name</th>
                )}
                {visibleCols.rollNumber && (
                  <th className="p-3 border-b text-left cursor-pointer" onClick={()=>toggleSort('rollNumber')}>Roll No</th>
                )}
                {visibleCols.branch && (
                  <th className="p-3 border-b text-left cursor-pointer" onClick={()=>toggleSort('branch')}>Department</th>
                )}
                {visibleCols.course && (
                  <th className="p-3 border-b text-left cursor-pointer" onClick={()=>toggleSort('course')}>Course</th>
                )}
                {visibleCols.year && (
                  <th className="p-3 border-b text-left cursor-pointer" onClick={()=>toggleSort('year')}>Year</th>
                )}
                {visibleCols.section && (
                  <th className="p-3 border-b text-left">Section</th>
                )}
                {visibleCols.attendance && (
                  <th className="p-3 border-b text-left">Attendance%</th>
                )}
                {visibleCols.backlogs && (
                  <th className="p-3 border-b text-left">Backlogs</th>
                )}
                {visibleCols.status && (
                  <th className="p-3 border-b text-left">Status</th>
                )}
                {visibleCols.placement && (
                  <th className="p-3 border-b text-left">Placement</th>
                )}
                {visibleCols.updatedAt && (
                  <th className="p-3 border-b text-left">UpdatedAt</th>
                )}
                {visibleCols.actions && (
                  <th className="p-3 border-b text-left">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td className="p-6 text-center text-gray-500" colSpan={10}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="p-6 text-center text-gray-500" colSpan={10}>No students found</td></tr>
              ) : (
                sortedItems.map((s, idx) => (
                  <tr key={s._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {visibleCols.select && (
                      <td className="p-3"><input type="checkbox" checked={!!selected[s._id]} onChange={e=>setSelected(m=>({...m,[s._id]: e.target.checked}))} /></td>
                    )}
                    {visibleCols.eye && (
                      <td className="p-3"><button onClick={()=>setModal({ open: true, student: s })} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border hover:bg-gray-50"><FiEye /> View</button></td>
                    )}
                    {visibleCols.name && (
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold">
                            {(s.name||'NA').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{s.name}</div>
                            <div className="text-xs text-gray-500 truncate">{s.email}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleCols.rollNumber && (<td className="p-3">{s.rollNumber || '—'}</td>)}
                    {visibleCols.branch && (<td className="p-3">{s.branch || '—'}</td>)}
                    {visibleCols.course && (<td className="p-3">{s.course || '—'}</td>)}
                    {visibleCols.year && (<td className="p-3">{s.year || '—'}</td>)}
                    {visibleCols.section && (<td className="p-3">{s.section || '—'}</td>)}
                    {visibleCols.attendance && (<td className="p-3">{'—'}</td>)}
                    {visibleCols.backlogs && (<td className="p-3">{'—'}</td>)}
                    {visibleCols.status && (<td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.isActive ? 'Active' : 'Blocked'}</span></td>)}
                    {visibleCols.placement && (<td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${s.isPlaced ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{s.isPlaced ? 'Placed' : 'Not Placed'}</span></td>)}
                    {visibleCols.updatedAt && (<td className="p-3">{'—'}</td>)}
                    {visibleCols.actions && (
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button onClick={()=>setConfirmDlg({ open: true, action: 'block', ids: [s._id] })} className="px-2 py-1 text-xs border rounded">Block</button>
                          <button onClick={()=>setConfirmDlg({ open: true, action: 'unblock', ids: [s._id] })} className="px-2 py-1 text-xs border rounded">Unblock</button>
                          <button onClick={()=>void viewResume(s._id)} disabled={resumeLoadingId===s._id} className="px-2 py-1 text-xs border rounded">
                            {resumeLoadingId===s._id ? 'Opening...' : 'View Resume'}
                          </button>
                          <div className="flex items-center gap-1">
                            <select
                              className="px-2 py-1 text-xs border rounded"
                              value={resumeSelected[s._id] || ''}
                              onChange={(e)=>setResumeSelected(m=>({ ...m, [s._id]: e.target.value }))}
                              onFocus={()=>{ if (!resumeLists[s._id]) void loadResumes(s._id) }}
                            >
                              <option value="">{resumeLists[s._id]?.length ? 'Select resume' : (resumeLoadingId===s._id ? 'Loading...' : 'Load resumes')}</option>
                              {(resumeLists[s._id]||[]).map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                            <button disabled={!resumeSelected[s._id]} onClick={()=>openSelectedResume(s._id)} className="px-2 py-1 text-xs border rounded">Open</button>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-600">Showing {Math.min(((filters.page||1)-1)* (filters.limit||10) + 1, Math.max(total, 1))} - {Math.min((filters.page||1)* (filters.limit||10), total)} of {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={(filters.page||1)===1} onClick={()=>setFilters(f=>({...f,page: Math.max((f.page||1)-1,1)}))} className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50">Prev</button>
            <button disabled={(filters.page||1)* (filters.limit||10) >= total} onClick={()=>setFilters(f=>({...f,page:(f.page||1)+1}))} className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
            <select value={filters.limit} onChange={e=>setFilters(f=>({...f,limit: parseInt(e.target.value), page:1}))} className="px-2 py-1.5 border rounded-lg">
              {[10,25,50,100].map(n=> <option key={n} value={n}>{n}/page</option>)}
            </select>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-white shadow-xl border rounded-xl px-4 py-3 text-sm text-gray-800">
              {message}
            </div>
          </div>
        )}

        {/* Modal */}
        {modal.open && modal.student && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setModal({open:false})} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">
              {/* Header */}
              <div className="bg-brand-primary px-6 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Student Details</h3>
                    <p className="text-white/90 text-sm">Comprehensive profile snapshot</p>
                  </div>
                  <button onClick={()=>setModal({open:false})} className="rounded-full hover:bg-white/20 px-2 py-1">✕</button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                {/* Identity Row */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-insta-1 via-insta-2 to-insta-4 text-white text-xl font-bold flex items-center justify-center shadow">
                    {(modal.student.name||'NA').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xl font-semibold text-gray-900 mr-2 flex items-center gap-2"><FiUser className="text-purple-600" />{modal.student.name}</h4>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${modal.student.isActive ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'}`}>{modal.student.isActive ? 'Active' : 'Blocked'}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${modal.student.isPlaced ? 'bg-status-success/10 text-status-success' : 'bg-accent-100 text-secondary-700'}`}>{modal.student.isPlaced ? 'Placed' : 'Not Placed'}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1 break-all flex items-center gap-2"><FiMail className="text-indigo-500" />{modal.student.email}</div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="text-xs text-gray-500">Roll No</div>
                    <div className="px-3 py-1 rounded-lg bg-gray-50 border text-sm font-medium text-gray-800 flex items-center gap-2"><FiHash />{modal.student.rollNumber||'—'}</div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div className="text-xs text-secondary-600 flex items-center gap-2"><FiBookOpen className="text-primary-500" /> Branch</div>
                    <div className="mt-1 font-semibold text-gray-900">{modal.student.branch||'—'}</div>
                  </div>
                  <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-pink-50 to-orange-50">
                    <div className="text-xs text-secondary-600 flex items-center gap-2"><FiAward className="text-primary-500" /> Course</div>
                    <div className="mt-1 font-semibold text-gray-900">{modal.student.course||'—'}</div>
                  </div>
                  <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
                    <div className="text-xs text-secondary-600 flex items-center gap-2"><FiCalendar className="text-primary-500" /> Year</div>
                    <div className="mt-1 font-semibold text-gray-900">{modal.student.year||'—'}</div>
                  </div>
                  <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-sky-50 to-cyan-50">
                    <div className="text-xs text-secondary-600 flex items-center gap-2"><FiGrid className="text-primary-500" /> Section</div>
                    <div className="mt-1 font-semibold text-gray-900">{modal.student.section||'—'}</div>
                  </div>
                  <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-green-50 to-lime-50">
                    <div className="text-xs text-gray-600 flex items-center gap-2"><FiCheckCircle className="text-green-600" /> Status</div>
                    <div className="mt-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${modal.student.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{modal.student.isActive ? 'Active' : 'Blocked'}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-purple-50 to-fuchsia-50">
                    <div className="text-xs text-secondary-600">Placement</div>
                    <div className="mt-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${modal.student.isPlaced ? 'bg-status-success/10 text-status-success' : 'bg-accent-100 text-secondary-700'}`}>{modal.student.isPlaced ? 'Placed' : 'Not Placed'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">Review academic and placement info. Update statuses using bulk actions in the table.</div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={()=>setModal({open:false})} className="px-5 py-2 rounded-xl text-white bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-black">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}
