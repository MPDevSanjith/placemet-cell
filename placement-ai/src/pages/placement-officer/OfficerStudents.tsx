import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Layout from '../../components/layout/Layout'
import { listOfficerStudents, bulkOfficerStudentAction, getStudentActiveResumeViewUrl, type OfficerStudent, getStudentFilterOptions, updateOfficerStudent } from '../../global/api'
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
  const [filterOptions, setFilterOptions] = useState<{ departments: string[]; courses: string[]; years: string[]; programTypes: string[] }>({ departments: [], courses: [], years: [], programTypes: [] })
  const [filtersLoading, setFiltersLoading] = useState(false)
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
  const [editModal, setEditModal] = useState<{ open: boolean; student?: OfficerStudent }>(() => ({ open: false }))
  const [editDraft, setEditDraft] = useState<Record<string, unknown>>({})
  const [editSaving, setEditSaving] = useState(false)
  const [placementModal, setPlacementModal] = useState<{ open: boolean; student?: OfficerStudent }>(() => ({ open: false }))
  const [placementDraft, setPlacementDraft] = useState<Record<string, unknown>>({})
  const [placementSaving, setPlacementSaving] = useState(false)
  const [bulkPlacementQueue, setBulkPlacementQueue] = useState<OfficerStudent[]>([])
  const [currentBulkIndex, setCurrentBulkIndex] = useState(0)
  
  // Request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected])
  const hasSelection = selectedIds.length > 0

  // Clear selections when major filters change (department, batch, year, course)
  // This ensures selections are cleared when switching to completely different student sets
  const clearSelectionsOnMajorFilterChange = useCallback(() => {
    setSelected({})
  }, [])

  const load = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      setLoading(true)
      const res = await listOfficerStudents(filters)
      
      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return
      }
      
      setItems(res?.items ?? [])
      setTotal(res?.total ?? 0)
      const activeMetric = (res && 'metrics' in res && (res as { metrics: { active?: number } }).metrics.active) || 0
      setMetrics(res?.metrics ? { total: res.metrics.total||0, placed: res.metrics.placed||0, blocked: res.metrics.blocked||0, active: activeMetric } : { total: 0, placed: 0, blocked: 0, active: 0 })
      
      // Don't reset selections when loading new data - keep global selection state
      // The selected state will be managed by individual checkbox interactions
    } catch (e: unknown) {
      // Don't show error if request was cancelled
      if (!abortController.signal.aborted) {
        setMessage(e instanceof Error ? e.message : 'Failed to load students')
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  // Load filter options for selects
  useEffect(() => {
    const run = async () => {
      try {
        setFiltersLoading(true)
        const res = await getStudentFilterOptions()
        if (res?.success && res.filters) {
          setFilterOptions({
            departments: res.filters.departments || [],
            courses: res.filters.courses || [],
            years: res.filters.years || [],
            programTypes: res.filters.programTypes || []
          })
        }
      } catch {
        // leave defaults
      } finally {
        setFiltersLoading(false)
      }
    }
    void run()
  }, [])

  // Debounce global search (500ms - increased from 300ms to reduce requests)
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, q: searchDraft, page: 1 }))
    }, 500)
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
    
    console.log('doBulk called with:', { action, ids })
    
    // For placement action, always show detailed modal for each student
    if (action === 'place') {
      // Get student details for all selected IDs (including those not on current page)
      const students: OfficerStudent[] = []
      
      // First, get students from current page
      const currentPageStudents = items.filter(s => ids.includes(s._id))
      students.push(...currentPageStudents)
      
      // For students not on current page, we need to fetch their details
      const currentPageIds = new Set(currentPageStudents.map(s => s._id))
      const missingIds = ids.filter(id => !currentPageIds.has(id))
      
      if (missingIds.length > 0) {
        try {
          console.log('Fetching details for students not on current page:', missingIds)
          // Fetch student details for missing IDs
          const auth = getAuth()
          const response = await fetch(`/api/placement-officer/students/bulk-details`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${auth?.token || ''}`
            },
            body: JSON.stringify({ ids: missingIds })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.students) {
              students.push(...result.students)
            }
          }
        } catch (error) {
          console.error('Error fetching student details:', error)
          // Continue with just current page students if fetch fails
        }
      }
      
      console.log('Found students for placement:', students)
      
      if (students.length > 0) {
        setConfirmDlg({ open: false, ids: [] })
        // Start bulk placement process
        setBulkPlacementQueue(students)
        setCurrentBulkIndex(0)
        console.log('Starting bulk placement for students:', students.map(s => s.name))
        
        // Small delay to ensure modal opens after dialog closes
        setTimeout(() => {
          console.log('Opening placement modal for:', students[0].name)
          openPlacementModal(students[0])
        }, 100)
        return
      }
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

  const openEdit = (s: OfficerStudent) => {
    setEditModal({ open: true, student: s })
    setEditDraft({
      name: s.name || '',
      email: s.email || '',
      rollNumber: s.rollNumber || '',
      branch: s.branch || '',
      course: s.course || '',
      section: s.section || '',
      year: s.year || '',
      phone: (s as unknown as { phone?: string })?.phone || '',
      cgpa: (s as unknown as { cgpa?: number })?.cgpa ?? '',
      programType: (s as unknown as { programType?: string })?.programType || '',
      admissionYear: (s as unknown as { admissionYear?: string; batch?: string })?.admissionYear || (s as unknown as { batch?: string })?.batch || ''
    })
  }

  const saveEdit = async () => {
    if (!editModal.student) return
    try {
      setEditSaving(true)
      const payload: Record<string, unknown> = { ...editDraft }
      if (typeof payload.cgpa === 'string' && payload.cgpa !== '') {
        const num = parseFloat(payload.cgpa as string)
        payload.cgpa = isNaN(num) ? undefined : num
      }
      await updateOfficerStudent(editModal.student._id, payload as Partial<{ name: string; email: string; branch: string; course: string; section: string; rollNumber: string; year: string; phone: string; cgpa: number; programType: string; admissionYear: string }>)
      setMessage('Student updated')
      setEditModal({ open: false })
      setEditDraft({})
      await load()
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setEditSaving(false)
    }
  }

  const openPlacementModal = (s: OfficerStudent) => {
    console.log('Opening placement modal for student:', s.name, s._id)
    setPlacementModal({ open: true, student: s })
    setPlacementDraft({
      companyName: '',
      designation: '',
      ctc: '',
      workLocation: '',
      joiningDate: '',
      remarks: '',
      offerLetterDriveLink: ''
    })
  }

  const savePlacement = async () => {
    if (!placementModal.student) return
    
    // Validate required fields
    if (!placementDraft.companyName || !placementDraft.designation || !placementDraft.ctc || !placementDraft.workLocation || !placementDraft.joiningDate) {
      setMessage('Please fill in all required fields')
      return
    }
    
    try {
      setPlacementSaving(true)
      const auth = getAuth()
      
      // Prepare the request body
      const requestBody = {
        companyName: placementDraft.companyName,
        designation: placementDraft.designation,
        ctc: placementDraft.ctc,
        workLocation: placementDraft.workLocation,
        joiningDate: placementDraft.joiningDate,
        remarks: placementDraft.remarks || '',
        offerLetterDriveLink: placementDraft.offerLetterDriveLink || ''
      }
      
      console.log('Sending placement data:', requestBody)
      
      const response = await fetch(`/api/placement-officer/students/${placementModal.student._id}/mark-placed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.token || ''}`
        },
        body: JSON.stringify(requestBody)
      })
      
      const responseData = await response.json()
      console.log('Placement response:', responseData)
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to mark student as placed')
      }
      
      // Check if this is part of a bulk placement process
      if (bulkPlacementQueue.length > 0) {
        const nextIndex = currentBulkIndex + 1
        if (nextIndex < bulkPlacementQueue.length) {
          // Move to next student in queue
          setCurrentBulkIndex(nextIndex)
          setPlacementDraft({
            companyName: '',
            designation: '',
            ctc: '',
            workLocation: '',
            joiningDate: '',
            remarks: '',
            offerLetterDriveLink: ''
          })
          // Open modal for next student
          setTimeout(() => {
            setPlacementModal({ open: true, student: bulkPlacementQueue[nextIndex] })
          }, 100)
        } else {
          // All students processed
          setMessage(`Successfully marked ${bulkPlacementQueue.length} student(s) as placed`)
          setPlacementModal({ open: false })
          setPlacementDraft({})
          setBulkPlacementQueue([])
          setCurrentBulkIndex(0)
          await load()
        }
      } else {
        // Single student placement
        setMessage(responseData.message || 'Student marked as placed successfully')
        setPlacementModal({ open: false })
        setPlacementDraft({})
        await load()
      }
    } catch (e: unknown) {
      console.error('Placement error:', e)
      setMessage(e instanceof Error ? e.message : 'Failed to mark student as placed')
      // Reset bulk placement state on error
      setBulkPlacementQueue([])
      setCurrentBulkIndex(0)
    } finally {
      setPlacementSaving(false)
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
            {/* Batch */}
            {filterOptions.years.length > 0 ? (
              <select className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.batch||''} onChange={e=>{setFilters(f=>({...f,batch:e.target.value,page:1})); clearSelectionsOnMajorFilterChange()}}>
                <option value="">Batch (All)</option>
                {filterOptions.years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            ) : (
              <input placeholder="Batch" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.batch||''} onChange={e=>setFilters(f=>({...f,batch:e.target.value,page:1}))} />
            )}
            {filterOptions.courses.length > 0 ? (
              <select className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.course||''} onChange={e=>{setFilters(f=>({...f,course:e.target.value,page:1})); clearSelectionsOnMajorFilterChange()}}>
                <option value="">Course (All)</option>
                {filterOptions.courses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input placeholder="Course" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.course||''} onChange={e=>{setFilters(f=>({...f,course:e.target.value,page:1})); clearSelectionsOnMajorFilterChange()}} />
            )}
            {filterOptions.departments.length > 0 ? (
              <select className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.department||''} onChange={e=>{setFilters(f=>({...f,department:e.target.value,page:1})); clearSelectionsOnMajorFilterChange()}}>
                <option value="">Department (All)</option>
                {filterOptions.departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <input placeholder="Department" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.department||''} onChange={e=>setFilters(f=>({...f,department:e.target.value,page:1}))} />
            )}
            <input placeholder="Section" className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" value={filters.section||''} onChange={e=>setFilters(f=>({...f,section:e.target.value,page:1}))} />
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
              {filtersLoading ? <span className="text-xs text-gray-500">Loading filter options...</span> : null}
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
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white rounded-2xl p-4 shadow border mb-4 flex flex-wrap items-center gap-2">
          {hasSelection && (
            <div className="flex items-center gap-2 mr-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
                </span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  Across all pages
                </span>
              </div>
              <button 
                onClick={() => setSelected({})} 
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear All
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button disabled={!hasSelection} onClick={()=>setConfirmDlg({ open: true, action: 'block', ids: selectedIds })} className={`px-3 py-2 rounded-lg border bg-status-danger text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Block
            </button>
            <button disabled={!hasSelection} onClick={()=>setConfirmDlg({ open: true, action: 'unblock', ids: selectedIds })} className={`px-3 py-2 rounded-lg border bg-status-success text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Unblock
            </button>
            <button disabled={!hasSelection} onClick={()=>setConfirmDlg({ open: true, action: 'place', ids: selectedIds })} className={`px-3 py-2 rounded-lg border bg-status-success text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Mark Placed ({selectedIds.length} student{selectedIds.length > 1 ? 's' : ''})
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
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setConfirmDlg({ open: false, ids: [] })} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h4>
              <p className="text-sm text-gray-600 mb-4">
                {confirmDlg.action === 'place' 
                  ? `Mark ${confirmDlg.ids.length} student(s) as placed? You will be asked to provide detailed placement information for each student.`
                  : `Are you sure you want to ${confirmDlg.action} ${confirmDlg.ids.length} selected student(s)?`
                }
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setConfirmDlg({ open: false, ids: [] })} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button onClick={()=>{ 
                  if (confirmDlg.action) { 
                    void doBulk(confirmDlg.action, confirmDlg.ids) 
                  } 
                  setConfirmDlg({ open: false, ids: [] })
                }} className="px-4 py-2 rounded-lg text-white bg-brand-primary hover:bg-brand-accent">Confirm</button>
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
                  <th className="p-3 border-b w-10">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" onChange={e=>toggleAll(e.target.checked)} />
                      {hasSelection && (
                        <span className="text-xs text-blue-600 font-medium">
                          {selectedIds.length}
                        </span>
                      )}
                    </div>
                  </th>
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
                          <button onClick={()=>openEdit(s)} className="px-2 py-1 text-xs border rounded">Edit</button>
                          <button onClick={()=>setConfirmDlg({ open: true, action: 'block', ids: [s._id] })} className="px-2 py-1 text-xs border rounded">Block</button>
                          <button onClick={()=>setConfirmDlg({ open: true, action: 'unblock', ids: [s._id] })} className="px-2 py-1 text-xs border rounded">Unblock</button>
                          {!s.isPlaced ? (
                            <button onClick={()=>openPlacementModal(s)} className="px-2 py-1 text-xs border rounded bg-green-100 text-green-700 hover:bg-green-200">Mark Placed</button>
                          ) : (
                            <button onClick={()=>setConfirmDlg({ open: true, action: 'unplace', ids: [s._id] })} className="px-2 py-1 text-xs border rounded bg-orange-100 text-orange-700 hover:bg-orange-200">Unmark Placed</button>
                          )}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm">
          <div className="text-gray-600">Showing {Math.min(((filters.page||1)-1)* (filters.limit||10) + 1, Math.max(total, 1))} - {Math.min((filters.page||1)* (filters.limit||10), total)} of {total}</div>
          {(() => {
            const currentPage = filters.page || 1
            const perPage = filters.limit || 10
            const totalPages = Math.max(1, Math.ceil(total / perPage))
            const pages: Array<number | 'ellipsis'> = []
            const add = (p: number | 'ellipsis') => { pages.push(p) }
            const windowSize = 1 // pages to show around current
            // Always show first
            add(1)
            // Left ellipsis
            if (currentPage - windowSize > 2) add('ellipsis')
            // Middle range
            for (let p = Math.max(2, currentPage - windowSize); p <= Math.min(totalPages - 1, currentPage + windowSize); p++) add(p)
            // Right ellipsis
            if (currentPage + windowSize < totalPages - 1) add('ellipsis')
            // Always show last (if more than one page)
            if (totalPages > 1) add(totalPages)
            const goTo = (p: number) => setFilters(f => ({ ...f, page: Math.min(Math.max(1, p), totalPages) }))
            return (
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => goTo(1)}
                  className="px-2.5 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  aria-label="First page"
                >«</button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => goTo(currentPage - 1)}
                  className="px-2.5 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Previous page"
                >Prev</button>
                <div className="flex items-center gap-1">
                  {pages.map((p, idx) => p === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goTo(p)}
                      className={`min-w-9 px-2.5 py-1.5 border rounded-lg ${p===currentPage? 'bg-primary-50 border-primary-200 text-primary-700' : 'hover:bg-gray-50'}`}
                      aria-current={p===currentPage ? 'page' : undefined}
                    >{p}</button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => goTo(currentPage + 1)}
                  className="px-2.5 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Next page"
                >Next</button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => goTo(totalPages)}
                  className="px-2.5 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  aria-label="Last page"
                >»</button>
                <select value={filters.limit} onChange={e=>setFilters(f=>({...f,limit: parseInt(e.target.value), page:1}))} className="ml-2 px-2 py-1.5 border rounded-lg">
                  {[10,25,50,100].map(n=> <option key={n} value={n}>{n}/page</option>)}
                </select>
              </div>
            )
          })()}
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
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
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
                  <div className="rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-yellow-50 to-amber-50">
                    <div className="text-xs text-secondary-600 flex items-center gap-2"><FiCalendar className="text-primary-500" /> Batch (Year)</div>
                    <div className="mt-1 font-semibold text-gray-900">{(modal.student as any).batch || (modal.student as any).admissionYear || '—'}</div>
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
                  {modal.student.isPlaced && (modal.student as any).placementDetails && (
                    <div className="col-span-full rounded-2xl p-4 border shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                      <div className="text-xs text-secondary-600 mb-2">Placement Details</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-medium">Company:</span> {(modal.student as any).placementDetails.companyName || '—'}</div>
                        <div><span className="font-medium">Designation:</span> {(modal.student as any).placementDetails.designation || '—'}</div>
                        <div><span className="font-medium">CTC:</span> {(modal.student as any).placementDetails.ctc ? `${(modal.student as any).placementDetails.ctc} LPA` : '—'}</div>
                        <div><span className="font-medium">Location:</span> {(modal.student as any).placementDetails.workLocation || '—'}</div>
                        <div><span className="font-medium">Joining Date:</span> {(modal.student as any).placementDetails.joiningDate ? new Date((modal.student as any).placementDetails.joiningDate).toLocaleDateString() : '—'}</div>
                        <div><span className="font-medium">Offer Letter:</span> {(modal.student as any).placementDetails.offerLetterDriveLink ? (
                          <a href={(modal.student as any).placementDetails.offerLetterDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                        ) : '—'}</div>
                        {(modal.student as any).placementDetails.remarks && (
                          <div className="col-span-full"><span className="font-medium">Remarks:</span> {(modal.student as any).placementDetails.remarks}</div>
                        )}
                      </div>
                    </div>
                  )}
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

        {/* Edit Modal */}
        {editModal.open && editModal.student && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setEditModal({ open: false })} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">
              <div className="bg-brand-primary px-6 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Edit Student</h3>
                    <p className="text-white/90 text-sm">Update student details</p>
                  </div>
                  <button onClick={()=>setEditModal({ open: false })} className="rounded-full hover:bg-white/20 px-2 py-1">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.name||'')} onChange={e=>setEditDraft(d=>({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Email</label>
                    <input className="w-full border rounded-lg px-3 py-2" type="email" value={String(editDraft.email||'')} onChange={e=>setEditDraft(d=>({ ...d, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Roll Number</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.rollNumber||'')} onChange={e=>setEditDraft(d=>({ ...d, rollNumber: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Phone</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.phone||'')} onChange={e=>setEditDraft(d=>({ ...d, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Department</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.branch||'')} onChange={e=>setEditDraft(d=>({ ...d, branch: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Course</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.course||'')} onChange={e=>setEditDraft(d=>({ ...d, course: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Section</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.section||'')} onChange={e=>setEditDraft(d=>({ ...d, section: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Year</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.year||'')} onChange={e=>setEditDraft(d=>({ ...d, year: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Batch (Admission Year)</label>
                    <input className="w-full border rounded-lg px-3 py-2" value={String(editDraft.admissionYear||'')} onChange={e=>setEditDraft(d=>({ ...d, admissionYear: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Program Type</label>
                    <input className="w-full border rounded-lg px-3 py-2" placeholder="UG / PG / Diploma / PhD" value={String(editDraft.programType||'')} onChange={e=>setEditDraft(d=>({ ...d, programType: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">CGPA</label>
                    <input className="w-full border rounded-lg px-3 py-2" type="number" step="0.01" value={String(editDraft.cgpa??'')} onChange={e=>setEditDraft(d=>({ ...d, cgpa: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={()=>setEditModal({ open: false })} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button onClick={()=>{ if(!editSaving){ void saveEdit() } }} disabled={editSaving} className="px-4 py-2 rounded-lg text-white bg-brand-primary hover:bg-brand-accent disabled:opacity-50">
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placement Modal */}
        {placementModal.open && placementModal.student && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setPlacementModal({open:false})} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="bg-green-600 px-6 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Mark as Placed</h3>
                    <p className="text-white/90 text-sm">
                      Add placement details for {placementModal.student.name}
                      {bulkPlacementQueue.length > 0 && (
                        <span className="block text-white/80 text-xs mt-1">
                          Student {currentBulkIndex + 1} of {bulkPlacementQueue.length}
                        </span>
                      )}
                    </p>
                  </div>
                  <button onClick={()=>{
                    setPlacementModal({open:false})
                    setBulkPlacementQueue([])
                    setCurrentBulkIndex(0)
                  }} className="rounded-full hover:bg-white/20 px-2 py-1">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Progress indicator for bulk operations */}
                {bulkPlacementQueue.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">
                        Processing student {currentBulkIndex + 1} of {bulkPlacementQueue.length}
                      </span>
                      <div className="w-32 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${((currentBulkIndex + 1) / bulkPlacementQueue.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                      value={String(placementDraft.companyName||'')} 
                      onChange={e=>setPlacementDraft(d=>({ ...d, companyName: e.target.value }))} 
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                      value={String(placementDraft.designation||'')} 
                      onChange={e=>setPlacementDraft(d=>({ ...d, designation: e.target.value }))} 
                      placeholder="Enter job designation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTC (LPA) *</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                      type="number"
                      step="0.1"
                      value={String(placementDraft.ctc||'')} 
                      onChange={e=>setPlacementDraft(d=>({ ...d, ctc: e.target.value }))} 
                      placeholder="Enter CTC in LPA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Location *</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                      value={String(placementDraft.workLocation||'')} 
                      onChange={e=>setPlacementDraft(d=>({ ...d, workLocation: e.target.value }))} 
                      placeholder="Enter work location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                      type="date"
                      value={String(placementDraft.joiningDate||'')} 
                      onChange={e=>setPlacementDraft(d=>({ ...d, joiningDate: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Letter Drive Link</label>
                    <input 
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                      value={String(placementDraft.offerLetterDriveLink||'')} 
                      onChange={e=>setPlacementDraft(d=>({ ...d, offerLetterDriveLink: e.target.value }))} 
                      placeholder="Google Drive link to offer letter"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea 
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                    rows={3}
                    value={String(placementDraft.remarks||'')} 
                    onChange={e=>setPlacementDraft(d=>({ ...d, remarks: e.target.value }))} 
                    placeholder="Additional remarks or notes"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-4">
                  <button onClick={()=>{
                    setPlacementModal({ open: false })
                    setBulkPlacementQueue([])
                    setCurrentBulkIndex(0)
                  }} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                  <button 
                    onClick={()=>{ if(!placementSaving){ void savePlacement() } }} 
                    disabled={placementSaving || !placementDraft.companyName || !placementDraft.designation || !placementDraft.ctc || !placementDraft.workLocation || !placementDraft.joiningDate} 
                    className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placementSaving ? 'Saving...' : 
                     bulkPlacementQueue.length > 0 && currentBulkIndex < bulkPlacementQueue.length - 1 ? 'Save & Next' : 
                     'Mark as Placed'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}
