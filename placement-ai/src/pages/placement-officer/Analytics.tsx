import { useMemo, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listOfficerStudents, type OfficerStudent, type OfficerStudentListResponse, getStudentFilterOptions } from '../../global/api'
import { colors } from '../../global/theme'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts'

type Filters = {
  q?: string
  batch?: string
  course?: string
  year?: string
  department?: string
  section?: string
  placed?: string
  blocked?: string
  programType?: string
  minCgpa?: string
  maxBacklogs?: string
  minAttendance?: string
}

type ExtendedStudent = OfficerStudent & {
  eligibilityCriteria?: { attendancePercentage?: number; backlogs?: number }
  onboardingData?: { academicInfo?: { gpa?: number } }
  onboardingCompleted?: boolean
  programType?: string
}

export default function PlacementAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<Filters>(() => ({
    q: searchParams.get('q') || '',
    batch: searchParams.get('batch') || '',
    course: searchParams.get('course') || '',
    year: searchParams.get('year') || '',
    department: searchParams.get('department') || '',
    section: searchParams.get('section') || '',
    placed: searchParams.get('placed') || '',
    blocked: searchParams.get('blocked') || '',
    programType: searchParams.get('programType') || '',
    minCgpa: searchParams.get('minCgpa') || '',
    maxBacklogs: searchParams.get('maxBacklogs') || '',
    minAttendance: searchParams.get('minAttendance') || ''
  }))

  const syncUrl = (next: Partial<Filters>) => {
    const merged: Filters = { ...filters, ...next }
    const sp = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) sp.set(k, String(v))
    })
    setSearchParams(sp, { replace: true })
    setFilters(merged)
  }

  const allQuery = useQuery<OfficerStudentListResponse>({
    queryKey: ['analytics-students', { ...filters, limit: 'all' }],
    queryFn: () => listOfficerStudents({ ...filters, limit: 'all' } as Record<string, string | number | boolean | undefined>),
  })

  const filterOptionsQuery = useQuery<{ success: boolean; filters: { departments: string[]; courses: string[]; years: string[]; programTypes: string[] } }>({
    queryKey: ['analytics-filter-options'],
    queryFn: () => getStudentFilterOptions(),
    staleTime: 5 * 60 * 1000
  })

  const students: ExtendedStudent[] = useMemo(() => {
    return (allQuery.data?.items as ExtendedStudent[]) || []
  }, [allQuery.data])

  // Note: dynamic filter option computation was unused; removing to satisfy TS strict unused checks.

  // KPIs
  const kpis = useMemo(() => {
    const total = students.length
    const eligible = students.filter(s => {
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      return att >= 80 && bl <= 0 && gpa >= 6
    }).length
    const placed = students.filter(s => s.isPlaced).length
    // Use overall placement rate (placed/total) as the main metric
    const placementRate = total > 0 ? Math.round((placed / total) * 100) : 0
    return { total, eligible, placed, placementRate }
  }, [students])

  // Aggregations
  const byProgram = useMemo(() => {
    const map: Record<string, { name: string; total: number; eligible: number; placed: number }> = {}
    const norm = (v: string | undefined) => {
      const x = String(v || '').toLowerCase()
      if (!x) return 'Unspecified'
      if (/^ug$/.test(x) || /(btech|b\.tech|be|b\.e|bsc|b\.sc|ba|b\.a|bcom|b\.com|bca|bba|undergrad|under\s*graduate)/.test(x)) return 'UG'
      if (/^pg$/.test(x) || /(mtech|m\.tech|me|m\.e|msc|m\.sc|ma|m\.a|mcom|m\.com|mca|mba|post\s*grad)/.test(x)) return 'PG'
      if (/(diploma|poly)/.test(x)) return 'Diploma'
      if (/(phd|doctorate)/.test(x)) return 'PhD'
      return x.toUpperCase()
    }
    students.forEach(s => {
      const key = norm(s.programType)
      if (!map[key]) map[key] = { name: key, total: 0, eligible: 0, placed: 0 }
      map[key].total += 1
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      if (att >= 80 && bl <= 0 && gpa >= 6) map[key].eligible += 1
      if (s.isPlaced) map[key].placed += 1
    })
    return Object.values(map).sort((a,b)=>a.name.localeCompare(b.name))
  }, [students])

  const byDepartment = useMemo(() => {
    const normalizeDept = (raw?: string) => {
      const v = String(raw || '').trim().toLowerCase()
      if (!v) return 'Unspecified'
      if (/(^cs$|^cse$|computer\s*science)/.test(v)) return 'Computer Science'
      if (/information\s*technology|^it$/.test(v)) return 'Information Technology'
      if (/electronics|^ece$/.test(v)) return 'Electronics'
      if (/mechanical|\bmech\b/.test(v)) return 'Mechanical'
      if (/civil/.test(v)) return 'Civil'
      if (/mca/.test(v)) return 'MCA'
      return v.replace(/\b\w/g, (c) => c.toUpperCase())
    }
    const map: Record<string, { name: string; total: number; eligible: number; placed: number }> = {}
    students.forEach(s => {
      const key = normalizeDept(s.branch)
      if (!map[key]) map[key] = { name: key, total: 0, eligible: 0, placed: 0 }
      map[key].total += 1
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      if (att >= 80 && bl <= 0 && gpa >= 6) map[key].eligible += 1
      if (s.isPlaced) map[key].placed += 1
    })
    return Object.values(map).sort((a,b)=>a.name.localeCompare(b.name))
  }, [students])

  const byBatch = useMemo(() => {
    const map: Record<string, { batch: string; total: number; eligible: number; placed: number }> = {}
    students.forEach(s => {
      const key = (s.year || 'NA') as string
      if (!map[key]) map[key] = { batch: key, total: 0, eligible: 0, placed: 0 }
      map[key].total += 1
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      if (att >= 80 && bl <= 0 && gpa >= 6) map[key].eligible += 1
      if (s.isPlaced) map[key].placed += 1
    })
    return Object.values(map).sort((a,b)=>a.batch.localeCompare(b.batch))
  }, [students])

  const cgpaHist = useMemo(() => {
    const map: Record<string, number> = { '0-5':0, '5-6':0, '6-7':0, '7-8':0, '8-9':0, '9-10':0 }
    students.forEach(s => {
      const g = s.onboardingData?.academicInfo?.gpa ?? 0
      if (g < 5) map['0-5']++
      else if (g < 6) map['5-6']++
      else if (g < 7) map['6-7']++
      else if (g < 8) map['7-8']++
      else if (g < 9) map['8-9']++
      else map['9-10']++
    })
    return Object.entries(map).map(([name,value])=>({ name, value }))
  }, [students])

  const attendanceHist = useMemo(() => {
    const map: Record<string, number> = { '<60':0, '60-70':0, '70-80':0, '80-90':0, '90-100':0 }
    students.forEach(s => {
      const a = s.eligibilityCriteria?.attendancePercentage ?? 0
      if (a < 60) map['<60']++
      else if (a < 70) map['60-70']++
      else if (a < 80) map['70-80']++
      else if (a < 90) map['80-90']++
      else map['90-100']++
    })
    return Object.entries(map).map(([name,value])=>({ name, value }))
  }, [students])

  const backlogHist = useMemo(() => {
    return [
      { name: '0', value: students.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 0).length },
      { name: '1', value: students.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 1).length },
      { name: '2', value: students.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 2).length },
      { name: '3+', value: students.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) >= 3).length },
    ]
  }, [students])

  const piePlacement = useMemo(() => {
    const placed = students.filter(s => s.isPlaced).length
    const notPlaced = students.length - placed
    return [
      { name: 'Placed', value: placed, color: colors.insta2 },
      { name: 'Not Placed', value: notPlaced, color: '#e5e7eb' }
    ]
  }, [students])

  // Detail view (drill-down)
  const [detail, setDetail] = useState<{ title: string; items: ExtendedStudent[] } | null>(null)
  const openDetail = (title: string, predicate: (s: ExtendedStudent) => boolean) => {
    setDetail({ title, items: students.filter(predicate) })
  }
  const normProgram = (v?: string) => {
    const x = String(v || '').toLowerCase()
    if (!x) return 'Unspecified'
    if (/^ug$/.test(x) || /(btech|b\.tech|be|b\.e|bsc|b\.sc|ba|b\.a|bcom|b\.com|bca|bba|undergrad|under\s*graduate)/.test(x)) return 'UG'
    if (/^pg$/.test(x) || /(mtech|m\.tech|me|m\.e|msc|m\.sc|ma|m\.a|mcom|m\.com|mca|mba|post\s*grad)/.test(x)) return 'PG'
    if (/(diploma|poly)/.test(x)) return 'Diploma'
    if (/(phd|doctorate)/.test(x)) return 'PhD'
    return x.toUpperCase()
  }

  return (
    <Layout title="Analytics" subtitle="Advanced insights across program, department, batches and more">
      <div className="p-6 space-y-6 bg-white">
        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
          {[{label:'Total',v:kpis.total},{label:'Eligible',v:kpis.eligible},{label:'Placed',v:kpis.placed},{label:'Placement Rate',v:`${kpis.placementRate}%`}].map(m=> (
            <div key={m.label} className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200">
              <div className="text-xs text-secondary-500">{m.label}</div>
              <div className="mt-1 text-2xl font-bold text-brand-text">{m.v}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="px-4">
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 grid md:grid-cols-3 lg:grid-cols-12 gap-3">
            <input placeholder="Search" value={filters.q||''} onChange={e=>syncUrl({q:e.target.value})} className="form-input" />
            <select value={filters.batch||''} onChange={e=>syncUrl({batch:e.target.value})} className="form-input">
              <option value="">Batch</option>
              {(filterOptionsQuery.data?.filters.years || []).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.course||''} onChange={e=>syncUrl({course:e.target.value})} className="form-input">
              <option value="">Course</option>
              {(filterOptionsQuery.data?.filters.courses || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.department||''} onChange={e=>syncUrl({department:e.target.value})} className="form-input">
              <option value="">Department</option>
              {(filterOptionsQuery.data?.filters.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input placeholder="Section" value={filters.section||''} onChange={e=>syncUrl({section:e.target.value})} className="form-input" />
            <select value={filters.programType||''} onChange={e=>syncUrl({programType:e.target.value})} className="form-input">
              <option value="">Program</option>
              {(filterOptionsQuery.data?.filters.programTypes || []).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input placeholder="Min CGPA" value={filters.minCgpa||''} onChange={e=>syncUrl({minCgpa:e.target.value})} className="form-input" />
            <input placeholder="Max Backlogs" value={filters.maxBacklogs||''} onChange={e=>syncUrl({maxBacklogs:e.target.value})} className="form-input" />
            <input placeholder="Min Attendance %" value={filters.minAttendance||''} onChange={e=>syncUrl({minAttendance:e.target.value})} className="form-input" />
            <select value={filters.placed||''} onChange={e=>syncUrl({placed:e.target.value})} className="form-input">
              <option value="">Placement</option>
              <option value="true">Placed</option>
              <option value="false">Not Placed</option>
            </select>
            <select value={filters.blocked||''} onChange={e=>syncUrl({blocked:e.target.value})} className="form-input">
              <option value="">Status</option>
              <option value="true">Blocked</option>
              <option value="false">Active</option>
            </select>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Program Type: Total vs Eligible vs Placed</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProgram} onClick={(e: unknown)=>{ const ev = e as { activePayload?: Array<{ payload?: { name?: string } }> } | undefined; const key = ev?.activePayload?.[0]?.payload?.name; if (key) openDetail(`Program: ${key}`, (s)=> normProgram(s.programType)===key) }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Bar dataKey="total" fill={colors.insta4} name="Total" />
                <Bar dataKey="eligible" fill="#10b981" name="Eligible" />
                <Bar dataKey="placed" fill={colors.insta2} name="Placed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Department: Total vs Eligible vs Placed</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} onClick={(e: unknown)=>{ const ev = e as { activePayload?: Array<{ payload?: { name?: string } }> } | undefined; const key = ev?.activePayload?.[0]?.payload?.name; if (key) openDetail(`Department: ${key}`, (s)=> (s.branch||'NA')===key) }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Bar dataKey="total" fill={colors.insta4} name="Total" />
                <Bar dataKey="eligible" fill="#10b981" name="Eligible" />
                <Bar dataKey="placed" fill={colors.insta2} name="Placed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Batch: Total vs Eligible vs Placed</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBatch} onClick={(e: unknown)=>{ const ev = e as { activePayload?: Array<{ payload?: { batch?: string } }> } | undefined; const key = ev?.activePayload?.[0]?.payload?.batch; if (key) openDetail(`Batch: ${key}`, (s)=> String(s.year||'NA')===String(key)) }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batch" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Bar dataKey="total" fill={colors.insta4} name="Total" />
                <Bar dataKey="eligible" fill="#10b981" name="Eligible" />
                <Bar dataKey="placed" fill={colors.insta2} name="Placed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Placement Split</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart onClick={(e: unknown)=>{
                const ev = e as { activePayload?: Array<{ name?: string; payload?: { name?: string } }> } | undefined;
                const key = ev?.activePayload?.[0]?.payload?.name || ev?.activePayload?.[0]?.name; if (!key) return;
                openDetail(key, (s)=> key==='Placed' ? !!s.isPlaced : !s.isPlaced)
              }}>
                <Pie data={piePlacement} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {piePlacement.map((e, idx) => <Cell key={`c-${idx}`} fill={e.color} />)}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">CGPA Distribution</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="value" fill="#60a5fa" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Attendance Distribution</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="value" fill="#f59e0b" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Backlogs Distribution</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backlogHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="value" fill="#ef4444" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Detail Drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={()=>setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-5xl max-h-[85vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold text-brand-text">{detail.title} — {detail.items.length} students</div>
              <button className="px-3 py-1.5 rounded bg-secondary-800 text-white" onClick={()=>setDetail(null)}>Close</button>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Program</th>
                    <th className="p-2 text-left">Dept</th>
                    <th className="p-2 text-left">Course</th>
                    <th className="p-2 text-left">Year</th>
                    <th className="p-2 text-left">CGPA</th>
                    <th className="p-2 text-left">Attend%</th>
                    <th className="p-2 text-left">Backlogs</th>
                    <th className="p-2 text-left">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {detail.items.map(s => (
                    <tr key={`${s._id}`}>
                      <td className="p-2">{s.name}</td>
                      <td className="p-2">{s.email}</td>
                      <td className="p-2">{normProgram(s.programType)}</td>
                      <td className="p-2">{s.branch || '—'}</td>
                      <td className="p-2">{(s as unknown as { course?: string }).course || '—'}</td>
                      <td className="p-2">{s.year || '—'}</td>
                      <td className="p-2">{s.onboardingData?.academicInfo?.gpa ?? '—'}</td>
                      <td className="p-2">{s.eligibilityCriteria?.attendancePercentage ?? '—'}</td>
                      <td className="p-2">{s.eligibilityCriteria?.backlogs ?? '—'}</td>
                      <td className="p-2">{s.isPlaced ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      </div>
      )}
    </Layout>
  )
}
