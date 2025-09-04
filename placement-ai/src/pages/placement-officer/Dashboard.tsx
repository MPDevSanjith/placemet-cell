import { useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listOfficerStudents, type OfficerStudent, type OfficerStudentListResponse } from '../../global/api'
import { Download, Calendar as CalendarIcon } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
  
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

  

  const exportCsv = () => {
    const rows = ((allQuery.data?.items as ExtendedStudent[]) || [])
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
  }

  const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g,'""')}"`

  return (
    <Layout title="Placement Dashboard" subtitle="Comprehensive overview and controls">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6 px-4 pt-4">
          <div className="text-sm text-gray-600">Insights and management for your batches</div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"><CalendarIcon size={16}/> Date range</button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white bg-brand-primary hover:bg-brand-accent"><Download size={16}/> Export CSV</button>
          </div>
        </div>

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
            <div key={m.label} className="bg-white rounded-2xl p-4 shadow">
              <div className="text-xs text-gray-500">{m.label}</div>
              <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                </div>
              ))}
            </div>

        {/* Filters */}
        <div className="mt-6 px-4">
          <div className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-3 lg:grid-cols-8 gap-3">
            <input placeholder="Search" value={filters.q||''} onChange={e=>syncUrl({q:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
            <input placeholder="Batch" value={filters.batch||''} onChange={e=>syncUrl({batch:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
            <input placeholder="Course" value={filters.course||''} onChange={e=>syncUrl({course:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
            <input placeholder="Year" value={filters.year||''} onChange={e=>syncUrl({year:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
            <input placeholder="Department" value={filters.department||''} onChange={e=>syncUrl({department:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
            <input placeholder="Section" value={filters.section||''} onChange={e=>syncUrl({section:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
            <select value={filters.placed||''} onChange={e=>syncUrl({placed:e.target.value,page:1})} className="border rounded-lg px-3 py-2">
              <option value="">Placement</option>
              <option value="true">Placed</option>
              <option value="false">Not Placed</option>
            </select>
            <select value={filters.blocked||''} onChange={e=>syncUrl({blocked:e.target.value,page:1})} className="border rounded-lg px-3 py-2">
              <option value="">Status</option>
              <option value="true">Blocked</option>
              <option value="false">Active</option>
            </select>
                    </div>
          {/* Applied chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(filters).filter(([k,v])=>!['page','limit'].includes(k) && v && String(v).length>0).map(([k,v])=> (
              <span key={k} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow text-sm">
                <span className="capitalize">{k}</span>
                <span className="text-gray-600">{String(v)}</span>
                <button className="text-gray-400 hover:text-gray-700" onClick={()=>syncUrl({[k]: ''} as Partial<Filters>)}>×</button>
              </span>
            ))}
            <button className="text-sm text-white bg-gray-900/80 hover:bg-black rounded-full px-3 py-1.5" onClick={()=>syncUrl({ q:'', batch:'', course:'', year:'', department:'', section:'', placed:'', blocked:'', page:1 })}>Clear all</button>
              </div>
            </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 mt-6">
          <div className="bg-white rounded-2xl p-4 shadow h-80">
            <div className="text-sm text-gray-600 mb-2">Batch-wise: total vs eligible vs placed</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchBar}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batch" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Bar dataKey="total" fill="#6366F1" name="Total" />
                <Bar dataKey="eligible" fill="#22C55E" name="Eligible" />
                <Bar dataKey="placed" fill="#DD2A7B" name="Placed" />
              </BarChart>
            </ResponsiveContainer>
                  </div>
          <div className="bg-white rounded-2xl p-4 shadow h-80">
            <div className="text-sm text-gray-600 mb-2">Department-wise: total vs eligible vs placed</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBar}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Bar dataKey="total" fill="#6366F1" name="Total" />
                <Bar dataKey="eligible" fill="#22C55E" name="Eligible" />
                <Bar dataKey="placed" fill="#DD2A7B" name="Placed" />
              </BarChart>
            </ResponsiveContainer>
                  </div>
          <div className="bg-white rounded-2xl p-4 shadow h-80">
            <div className="text-sm text-gray-600 mb-2">Eligibility Funnel</div>
            <div className="grid grid-cols-4 gap-3 h-full items-center">
              {[{label:'Total',v:kpis.total},{label:'Eligible',v:kpis.eligible},{label:'Interviewed',v:Math.round(kpis.eligible*0.6)},{label:'Placed',v:kpis.placed}].map((s,i)=> (
                <div key={s.label} className="flex flex-col items-center">
                  <div className={`w-full h-40 rounded-2xl ${['bg-indigo-100','bg-emerald-100','bg-amber-100','bg-pink-100'][i]} flex items-center justify-center font-bold text-gray-800`}>{s.v}</div>
                  <div className="mt-2 text-sm text-gray-700">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          <div className="bg-white rounded-2xl p-4 shadow h-80">
            <div className="text-sm text-gray-600 mb-2">Backlogs Histogram</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backlogHist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="value" fill="#F59E0B" name="Students" />
              </BarChart>
            </ResponsiveContainer>
                  </div>
                  </div>

        {/* Student Table */}
        
      </div>
    </Layout>
  )
}
