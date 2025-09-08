


import { useMemo, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listOfficerStudents, type OfficerStudent, type OfficerStudentListResponse } from '../../global/api'
import { Download, Mail, Trophy, CalendarClock } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
  
} from 'recharts'
import { colors } from '../../global/theme'

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
  limit?: number | 'all'
}

const ATTENDANCE_MIN = 75
const BACKLOG_MAX = 1

export default function PlacementOfficerDashboard() {
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
    page: Number(searchParams.get('page') || 1),
    limit: Number(searchParams.get('limit') || 10),
  }))

  // keep URL in sync
  const syncUrl = (next: Partial<Filters>) => {
    const merged: Filters = { ...filters, ...next }
    const sp = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) sp.set(k, String(v))
    })
    setSearchParams(sp, { replace: true })
    setFilters(merged)
  }

  // (table query removed; charts use all data)

  // data: all for charts/KPIs
  const allQuery = useQuery<OfficerStudentListResponse>({
    queryKey: ['po-students-all', { ...filters, page: 1, limit: 'all' }],
    queryFn: () => listOfficerStudents({ ...filters, page: 1, limit: 'all' } as Record<string, string | number | boolean | undefined>),
  })

  type ExtendedStudent = OfficerStudent & { eligibilityCriteria?: { attendancePercentage?: number; backlogs?: number } }
  const studentsAll: ExtendedStudent[] = useMemo(() => {
    return (allQuery.data?.items as ExtendedStudent[]) || []
  }, [allQuery.data])

  const kpis = useMemo(() => {
    const total = studentsAll.length
    const eligible = studentsAll.filter(s => (s.eligibilityCriteria?.attendancePercentage ?? 0) >= ATTENDANCE_MIN && (s.eligibilityCriteria?.backlogs ?? 99) <= BACKLOG_MAX).length
    const placed = studentsAll.filter(s => s.isPlaced).length
    const blocked = studentsAll.filter(s => s.isActive === false).length
    const active = total - blocked
    const placementRate = eligible > 0 ? Math.round((placed / eligible) * 100) : 0
    const backlogBuckets = {
      '0': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 0).length,
      '1': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 1).length,
      '2': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 2).length,
      '3+': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) >= 3).length,
    }
    return { total, eligible, placed, blocked, active, placementRate, backlogBuckets }
  }, [studentsAll])

  const batchBar = useMemo(() => {
    const map: Record<string, { batch: string; total: number; eligible: number; placed: number }> = {}
    studentsAll.forEach(s => {
      const key = (s.year || 'NA') as string
      if (!map[key]) map[key] = { batch: key, total: 0, eligible: 0, placed: 0 }
      map[key].total += 1
      const isEligible = (s.eligibilityCriteria?.attendancePercentage ?? 0) >= ATTENDANCE_MIN && (s.eligibilityCriteria?.backlogs ?? 99) <= BACKLOG_MAX
      if (isEligible) map[key].eligible += 1
      if (s.isPlaced) map[key].placed += 1
    })
    return Object.values(map).sort((a,b)=>a.batch.localeCompare(b.batch))
  }, [studentsAll])

  const deptBar = useMemo(() => {
    const map: Record<string, { name: string; total: number; eligible: number; placed: number }> = {}
    studentsAll.forEach(s => {
      const dept = s.branch || 'NA'
      if (!map[dept]) map[dept] = { name: dept, total: 0, eligible: 0, placed: 0 }
      map[dept].total += 1
      const isEligible = (s.eligibilityCriteria?.attendancePercentage ?? 0) >= ATTENDANCE_MIN && (s.eligibilityCriteria?.backlogs ?? 99) <= BACKLOG_MAX
      if (isEligible) map[dept].eligible += 1
      if (s.isPlaced) map[dept].placed += 1
    })
    return Object.values(map).sort((a,b)=>a.name.localeCompare(b.name))
  }, [studentsAll])

  const backlogHist = useMemo(() => {
    return [
      { name: '0', value: kpis.backlogBuckets['0'] },
      { name: '1', value: kpis.backlogBuckets['1'] },
      { name: '2', value: kpis.backlogBuckets['2'] },
      { name: '3+', value: kpis.backlogBuckets['3+'] },
    ]
  }, [kpis])

  

  // legacy CSV export kept for reference but unused; handled by exportData via exportType

  const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g,'""')}"`

  const [exportType, setExportType] = useState<'csv'|'pdf'|'doc'>('csv')
  const exportData = () => {
    const rows = ((allQuery.data?.items as ExtendedStudent[]) || [])
    if (exportType === 'csv') {
      const headers = ['Name','Email','Roll No','Department','Course','Year','Section','Active','Placed','Attendance%','Backlogs']
      const csv = [headers.join(',')]
      rows.forEach((s: ExtendedStudent)=>{
        csv.push([
          quote(s.name), quote(s.email), quote(s.rollNumber||''), quote(s.branch||''), quote(s.course||''), quote(s.year||''), quote(s.section||''),
          s.isActive ? 'Active' : 'Blocked', s.isPlaced ? 'Placed' : 'Not Placed',
          s.eligibilityCriteria?.attendancePercentage ?? '', s.eligibilityCriteria?.backlogs ?? ''
        ].join(','))
      })
      const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students.csv'
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    // Build simple HTML table for doc/pdf routes
    const htmlRows = rows.map((s: ExtendedStudent)=>`
      <tr>
        <td>${s.name||''}</td>
        <td>${s.email||''}</td>
        <td>${s.rollNumber||''}</td>
        <td>${s.branch||''}</td>
        <td>${s.course||''}</td>
        <td>${s.year||''}</td>
        <td>${s.section||''}</td>
        <td>${s.isActive ? 'Active':'Blocked'}</td>
        <td>${s.isPlaced ? 'Placed':'Not Placed'}</td>
        <td>${s.eligibilityCriteria?.attendancePercentage ?? ''}</td>
        <td>${s.eligibilityCriteria?.backlogs ?? ''}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Students</title>
      <style>
        body{font-family: Arial, sans-serif;}
        table{border-collapse: collapse; width: 100%;}
        th,td{border:1px solid #e5e7eb; padding:8px; font-size:12px;}
        th{background:#f8fafc; text-align:left;}
      </style>
    </head><body>
      <h2>Students</h2>
      <table>
        <thead><tr>
          <th>Name</th><th>Email</th><th>Roll No</th><th>Department</th><th>Course</th><th>Year</th><th>Section</th><th>Status</th><th>Placement</th><th>Attendance%</th><th>Backlogs</th>
        </tr></thead>
        <tbody>${htmlRows}</tbody>
      </table>
    </body></html>`
    if (exportType === 'doc') {
      const blob = new Blob([html], { type: 'application/msword' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students.doc'
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    // pdf: open printable view, user can Save as PDF
    const win = window.open('', '_blank')
    if (win) {
      win.document.open()
      win.document.write(html)
      win.document.close()
      win.focus()
      win.print()
    }
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 bg-white">
        {/* Header spacer removed for seamless content */}
        

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 px-4">
          {[
            { label: 'Total', value: kpis.total },
            { label: 'Eligible', value: kpis.eligible },
            { label: 'Placed', value: kpis.placed },
            { label: 'Blocked', value: kpis.blocked },
            { label: 'Active', value: kpis.active },
            { label: 'Placement Rate', value: `${kpis.placementRate}%` },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200">
              <div className="text-xs text-secondary-500">{m.label}</div>
              <div className="mt-1 text-2xl font-bold text-brand-text">{m.value}</div>
                </div>
              ))}
            </div>

        {/* Card grids - Department, Eligibility, Placement */}
        <div className="px-4 space-y-6" id="dept">
          {/* Department quick filter chips */}
          <div className="flex flex-wrap gap-2">
            {deptBar.map(d => (
              <button
                key={d.name}
                onClick={() => syncUrl({ department: filters.department === d.name ? '' : d.name, page: 1 })}
                className={`text-sm px-3 py-1.5 rounded-full border shadow-subtle ${filters.department === d.name ? 'bg-primary-50 text-primary-700 border-primary-100' : 'bg-white text-secondary-700 border-accent-200 hover:bg-accent-50'}`}
              >
                {d.name}
              </button>
            ))}
            {deptBar.length > 0 && (
              <button onClick={() => syncUrl({ department: '', page: 1 })} className="text-sm px-3 py-1.5 rounded-full bg-secondary-800 text-white hover:bg-secondary-900">Clear</button>
            )}
          </div>
          {/* Department cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deptBar.map((d) => (
              <div key={d.name} className="bg-white rounded-2xl p-4 border border-accent-200 shadow-subtle">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-secondary-500">Department</div>
                    <div className="mt-0.5 text-lg font-semibold text-brand-text">{d.name}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">{d.total} total</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-accent-100 rounded-xl p-3">
                    <div className="text-xs text-secondary-500">Total</div>
                    <div className="mt-1 font-bold text-secondary-800">{d.total}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <div className="text-xs text-secondary-500">Eligible</div>
                    <div className="mt-1 font-bold text-secondary-800">{d.eligible}</div>
                  </div>
                  <div className="bg-insta-2/10 rounded-xl p-3">
                    <div className="text-xs text-secondary-500">Placed</div>
                    <div className="mt-1 font-bold text-secondary-800">{d.placed}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Eligibility cards */}
          {(() => {
            const eligible = kpis.eligible
            const notEligible = Math.max(kpis.total - eligible, 0)
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="eligibility">
                <div className="bg-white rounded-2xl p-5 border border-accent-200 shadow-subtle">
                  <div className="text-sm text-secondary-500">Eligibility</div>
                  <div className="mt-1 text-2xl font-bold text-brand-text">{eligible}</div>
                  <div className="mt-3 h-2 w-full bg-accent-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${kpis.total ? Math.round((eligible / kpis.total) * 100) : 0}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-secondary-600">{kpis.total ? Math.round((eligible / kpis.total) * 100) : 0}% of total students</div>
                   {/* action buttons removed per request */}
                </div>
                <div className="bg-white rounded-2xl p-5 border border-accent-200 shadow-subtle">
                  <div className="text-sm text-secondary-500">Not Eligible</div>
                  <div className="mt-1 text-2xl font-bold text-brand-text">{notEligible}</div>
                  <div className="mt-3 h-2 w-full bg-accent-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${kpis.total ? Math.round((notEligible / kpis.total) * 100) : 0}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-secondary-600">{kpis.total ? Math.round((notEligible / kpis.total) * 100) : 0}% of total students</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-accent-200 shadow-subtle">
                  <div className="text-sm text-secondary-500">Placement Rate</div>
                  <div className="mt-1 text-2xl font-bold text-brand-text">{kpis.placementRate}%</div>
                  <div className="mt-3 h-2 w-full bg-accent-100 rounded-full overflow-hidden">
                    <div className="h-full bg-insta-2" style={{ width: `${kpis.placementRate}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-secondary-600">Based on eligible students</div>
                  <div className="mt-3 text-xs text-secondary-600">Insight: {kpis.placementRate >= 65 ? 'Top performing cohorts' : 'Consider eligibility drives'}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Placement cards */}
          {(() => {
            const placed = kpis.placed
            const notPlaced = Math.max(kpis.total - placed, 0)
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="placement">
                <div className="bg-white rounded-2xl p-5 border border-accent-200 shadow-subtle">
                  <div className="text-sm text-secondary-500">Placed</div>
                  <div className="mt-1 text-2xl font-bold text-brand-text">{placed}</div>
                  <div className="mt-3 h-2 w-full bg-accent-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${kpis.total ? Math.round((placed / kpis.total) * 100) : 0}%` }} />
                  </div>
                  {/* action buttons removed per request */}
                </div>
                <div className="bg-white rounded-2xl p-5 border border-accent-200 shadow-subtle">
                  <div className="text-sm text-secondary-500">Not Placed</div>
                  <div className="mt-1 text-2xl font-bold text-brand-text">{notPlaced}</div>
                  <div className="mt-3 h-2 w-full bg-accent-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400" style={{ width: `${kpis.total ? Math.round((notPlaced / kpis.total) * 100) : 0}%` }} />
                  </div>
                  {/* action buttons removed per request */}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Filters */}
        <div className="mt-6 px-4">
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 grid md:grid-cols-3 lg:grid-cols-9 gap-3">
            <input placeholder="Search" value={filters.q||''} onChange={e=>syncUrl({q:e.target.value,page:1})} className="form-input" />
            <input placeholder="Batch" value={filters.batch||''} onChange={e=>syncUrl({batch:e.target.value,page:1})} className="form-input" />
            <input placeholder="Course" value={filters.course||''} onChange={e=>syncUrl({course:e.target.value,page:1})} className="form-input" />
            <input placeholder="Year" value={filters.year||''} onChange={e=>syncUrl({year:e.target.value,page:1})} className="form-input" />
            <input placeholder="Department" value={filters.department||''} onChange={e=>syncUrl({department:e.target.value,page:1})} className="form-input" />
            <input placeholder="Section" value={filters.section||''} onChange={e=>syncUrl({section:e.target.value,page:1})} className="form-input" />
            <select value={filters.placed||''} onChange={e=>syncUrl({placed:e.target.value,page:1})} className="form-input">
              <option value="">Placement</option>
              <option value="true">Placed</option>
              <option value="false">Not Placed</option>
            </select>
            <select value={filters.blocked||''} onChange={e=>syncUrl({blocked:e.target.value,page:1})} className="form-input">
              <option value="">Status</option>
              <option value="true">Blocked</option>
              <option value="false">Active</option>
            </select>
            <div className="flex items-center gap-2">
              <select value={exportType} onChange={e=>setExportType(e.target.value as 'csv'|'pdf'|'doc')} className="form-input">
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="doc">Doc</option>
              </select>
              <button onClick={exportData} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-subtle">
                <Download size={16}/>
                <span>Export</span>
              </button>
            </div>
                    </div>
          {/* Applied chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(filters).filter(([k,v])=>!['page','limit'].includes(k) && v && String(v).length>0).map(([k,v])=> (
              <span key={k} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-100 text-secondary-700 border border-accent-200 shadow-subtle text-sm">
                <span className="capitalize">{k}</span>
                <span className="text-secondary-600">{String(v)}</span>
                <button className="text-secondary-400 hover:text-secondary-700" onClick={()=>syncUrl({[k]: ''} as Partial<Filters>)}>×</button>
              </span>
            ))}
            <button className="text-sm text-white bg-secondary-800 hover:bg-secondary-900 rounded-full px-3 py-1.5" onClick={()=>syncUrl({ q:'', batch:'', course:'', year:'', department:'', section:'', placed:'', blocked:'', page:1 })}>Clear all</button>
              </div>
            </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 mt-6">
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Batch-wise: total vs eligible vs placed</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchBar}>
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
            <div className="text-sm text-secondary-600 mb-2">Department-wise: total vs eligible vs placed</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBar}>
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
            <div className="text-sm text-secondary-600 mb-2">Eligibility Funnel</div>
            <div className="grid grid-cols-4 gap-3 h-full items-center">
              {[{label:'Total',v:kpis.total},{label:'Eligible',v:kpis.eligible},{label:'Interviewed',v:Math.round(kpis.eligible*0.6)},{label:'Placed',v:kpis.placed}].map((s,i)=> (
                <div key={s.label} className="flex flex-col items-center">
                  <div className={`w-full h-40 rounded-2xl ${['bg-primary-100','bg-emerald-100','bg-amber-100','bg-insta-2/20'][i]} flex items-center justify-center font-bold text-secondary-800`}>{s.v}</div>
                  <div className="mt-2 text-sm text-secondary-700">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          <div className="bg-white rounded-2xl p-4 shadow-subtle border border-accent-200 h-80">
            <div className="text-sm text-secondary-600 mb-2">Backlogs Histogram</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backlogHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="value" fill="#f59e0b" name="Students" />
              </BarChart>
            </ResponsiveContainer>
                  </div>
                  </div>

        {/* Student Table */}
        
      </div>
    </Layout>
  )
}