import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { listOfficerStudents, updateOfficerStudent, type OfficerStudent } from '../../global/api'

export default function AllStudents() {
  const [filters, setFilters] = useState<{ q?: string; course?: string; department?: string; batch?: string; year?: string; placed?: string; blocked?: string; page?: number; limit?: number }>({ page: 1, limit: 25 })
  const [items, setItems] = useState<OfficerStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [editRowId, setEditRowId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})

  const load = async () => {
    try {
      setLoading(true)
      const res = await listOfficerStudents(filters)
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [filters.page, filters.limit, filters.q, filters.course, filters.department, filters.batch, filters.year, filters.placed, filters.blocked])

  const startEdit = (s: OfficerStudent) => {
    setEditRowId(s._id)
    setDraft({ branch: s.branch || '', course: s.course || '', section: (s as any).section || '', year: s.year || '', programType: (s as any).programType || '' })
  }

  const cancelEdit = () => { setEditRowId(null); setDraft({}) }

  const saveEdit = async (id: string) => {
    try {
      await updateOfficerStudent(id, {
        branch: draft.branch,
        course: draft.course,
        section: draft.section,
        year: draft.year,
        programType: (draft as any).programType,
      })
      setMessage('Student updated')
      setEditRowId(null)
      setDraft({})
      void load()
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Update failed')
    }
  }

  const rows = useMemo(() => items, [items])

  return (
    <Layout title="All Students" subtitle="Full list with advanced filters and inline edit">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl p-4 shadow border mb-4 grid md:grid-cols-3 lg:grid-cols-8 gap-2">
          <input className="border rounded px-2 py-1" placeholder="Search name/email/roll" value={filters.q||''} onChange={e=>setFilters(f=>({ ...f, q: e.target.value, page:1 }))} />
          <input className="border rounded px-2 py-1" placeholder="Course (e.g., Computer Science)" value={filters.course||''} onChange={e=>setFilters(f=>({ ...f, course: e.target.value, page:1 }))} />
          <input className="border rounded px-2 py-1" placeholder="Department" value={filters.department||''} onChange={e=>setFilters(f=>({ ...f, department: e.target.value, page:1 }))} />
          <input className="border rounded px-2 py-1" placeholder="Batch (Admission Year)" value={filters.batch||''} onChange={e=>setFilters(f=>({ ...f, batch: e.target.value, page:1 }))} />
          <input className="border rounded px-2 py-1" placeholder="Year" value={filters.year||''} onChange={e=>setFilters(f=>({ ...f, year: e.target.value, page:1 }))} />
          <select className="border rounded px-2 py-1" value={filters.placed||''} onChange={e=>setFilters(f=>({ ...f, placed: e.target.value, page:1 }))}>
            <option value="">Placed?</option>
            <option value="true">Placed</option>
            <option value="false">Not Placed</option>
          </select>
          <select className="border rounded px-2 py-1" value={filters.blocked||''} onChange={e=>setFilters(f=>({ ...f, blocked: e.target.value, page:1 }))}>
            <option value="">Active?</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>
          <button onClick={()=>setFilters({ page:1, limit: filters.limit })} className="border rounded px-2 py-1">Clear</button>
        </div>

        <div className="bg-white rounded-xl shadow border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Roll</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Course</th>
                <th className="p-3 text-left">Section</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Program Type</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td className="p-4 text-center" colSpan={9}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="p-4 text-center" colSpan={9}>No results</td></tr>
              ) : rows.map(s => (
                <tr key={s._id}>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.rollNumber || '—'}</td>
                  <td className="p-3">
                    {editRowId === s._id ? (
                      <input className="border rounded px-2 py-1" value={draft.branch||''} onChange={e=>setDraft(d=>({ ...d, branch: e.target.value }))} />
                    ) : (s.branch || '—')}
                  </td>
                  <td className="p-3">
                    {editRowId === s._id ? (
                      <input className="border rounded px-2 py-1" value={draft.course||''} onChange={e=>setDraft(d=>({ ...d, course: e.target.value }))} />
                    ) : (s.course || '—')}
                  </td>
                  <td className="p-3">
                    {editRowId === s._id ? (
                      <input className="border rounded px-2 py-1" value={draft.section||''} onChange={e=>setDraft(d=>({ ...d, section: e.target.value }))} />
                    ) : ((s as any).section || '—')}
                  </td>
                  <td className="p-3">
                    {editRowId === s._id ? (
                      <input className="border rounded px-2 py-1" value={draft.year||''} onChange={e=>setDraft(d=>({ ...d, year: e.target.value }))} />
                    ) : (s.year || '—')}
                  </td>
                  <td className="p-3">
                    {editRowId === s._id ? (
                      <input className="border rounded px-2 py-1" placeholder="UG / PG / Diploma / PhD" value={(draft as any).programType||''} onChange={e=>setDraft(d=>({ ...d, programType: e.target.value }))} />
                    ) : ((s as any).programType || '—')}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.isActive ? 'Active' : 'Blocked'}</span>
                  </td>
                  <td className="p-3 space-x-2">
                    {editRowId === s._id ? (
                      <>
                        <button onClick={()=>void saveEdit(s._id)} className="px-2 py-1 text-xs border rounded bg-green-600 text-white">Save</button>
                        <button onClick={cancelEdit} className="px-2 py-1 text-xs border rounded">Cancel</button>
                      </>
                    ) : (
                      <button onClick={()=>startEdit(s)} className="px-2 py-1 text-xs border rounded">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-gray-600">Showing {Math.min(((filters.page||1)-1)* (filters.limit||25) + 1, Math.max(total, 1))} - {Math.min((filters.page||1)* (filters.limit||25), total)} of {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={(filters.page||1)===1} onClick={()=>setFilters(f=>({ ...f, page: Math.max(1, (f.page||1)-1) }))} className="px-3 py-1.5 border rounded disabled:opacity-50">Prev</button>
            <button disabled={(filters.page||1)* (filters.limit||25) >= total} onClick={()=>setFilters(f=>({ ...f, page: (f.page||1)+1 }))} className="px-3 py-1.5 border rounded disabled:opacity-50">Next</button>
            <select value={filters.limit} onChange={e=>setFilters(f=>({ ...f, limit: parseInt(e.target.value), page:1 }))} className="px-2 py-1.5 border rounded">
              {[25,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
          </div>
        </div>

        {message && (
          <div className="fixed bottom-6 right-6 bg-white border rounded shadow px-4 py-2 text-sm">{message}</div>
        )}
      </div>
    </Layout>
  )
}
