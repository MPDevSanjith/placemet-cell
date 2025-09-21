


import { useMemo, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listOfficerStudents, type OfficerStudent, type OfficerStudentListResponse, getStudentFilterOptions } from '../../global/api'
import { Download } from 'lucide-react'
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
  programType?: string
  minCgpa?: string
  maxBacklogs?: string
  minAttendance?: string
  page?: number
  limit?: number | 'all'
}

const DEFAULT_ATTENDANCE_MIN = 80
const DEFAULT_BACKLOG_MAX = 0
const DEFAULT_CGPA_MIN = 6

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
    programType: searchParams.get('programType') || '',
    minCgpa: searchParams.get('minCgpa') || '',
    maxBacklogs: searchParams.get('maxBacklogs') || '',
    minAttendance: searchParams.get('minAttendance') || '',
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

  // Eligibility criteria (editable)
  const [eligibility] = useState<{ attendanceMin: number; backlogMax: number; cgpaMin: number }>(() => {
    const saved = localStorage.getItem('po_eligibility_criteria')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore malformed */ }
    }
    return { attendanceMin: DEFAULT_ATTENDANCE_MIN, backlogMax: DEFAULT_BACKLOG_MAX, cgpaMin: DEFAULT_CGPA_MIN }
  })
  // Note: eligibility is adjusted elsewhere when needed; persistence handled locally when used

  // (no server-backed eligibility settings here)

  // data: all for charts/KPIs
  const allQuery = useQuery<OfficerStudentListResponse>({
    queryKey: ['po-students-all', { ...filters, page: 1, limit: 'all' }],
    queryFn: () => listOfficerStudents({ ...filters, page: 1, limit: 'all' } as Record<string, string | number | boolean | undefined>),
  })

  // Fetch filter options to populate dropdowns
  const filterOptionsQuery = useQuery<{ success: boolean; filters: { departments: string[]; courses: string[]; years: string[]; programTypes: string[] } }>({
    queryKey: ['po-student-filter-options'],
    queryFn: () => getStudentFilterOptions(),
    staleTime: 5 * 60 * 1000
  })

  type ExtendedStudent = OfficerStudent & {
    eligibilityCriteria?: { attendancePercentage?: number; backlogs?: number }
    onboardingData?: { academicInfo?: { gpa?: number } }
    onboardingCompleted?: boolean
    programType?: string
    section?: string
  }
  const studentsAll: ExtendedStudent[] = useMemo(() => {
    return (allQuery.data?.items as ExtendedStudent[]) || []
  }, [allQuery.data])

  const kpis = useMemo(() => {
    const total = studentsAll.length
    const eligible = studentsAll.filter(s => {
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      return att >= eligibility.attendanceMin && bl <= eligibility.backlogMax && gpa >= eligibility.cgpaMin
    }).length
    const placed = studentsAll.filter(s => s.isPlaced).length
    const blocked = studentsAll.filter(s => s.isActive === false).length
    const active = total - blocked
    const placementRate = total > 0 ? Math.round((placed / total) * 100) : 0
    console.log('Dashboard KPIs:', { total, eligible, placed, blocked, active, placementRate })
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
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      const isEligible = att >= eligibility.attendanceMin && bl <= eligibility.backlogMax && gpa >= eligibility.cgpaMin
      if (isEligible) map[key].eligible += 1
      if (s.isPlaced) map[key].placed += 1
    })
    return Object.values(map).sort((a,b)=>a.batch.localeCompare(b.batch))
  }, [studentsAll, eligibility])

  const deptBar = useMemo(() => {
    const map: Record<string, { name: string; total: number; eligible: number; placed: number }> = {}
    studentsAll.forEach(s => {
      const dept = s.branch || 'NA'
      if (!map[dept]) map[dept] = { name: dept, total: 0, eligible: 0, placed: 0 }
      map[dept].total += 1
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      const isEligible = att >= eligibility.attendanceMin && bl <= eligibility.backlogMax && gpa >= eligibility.cgpaMin
      if (isEligible) map[dept].eligible += 1
      if (s.isPlaced) map[dept].placed += 1
    })
    return Object.values(map).sort((a,b)=>a.name.localeCompare(b.name))
  }, [studentsAll, eligibility])

  const backlogHist = useMemo(() => {
    return [
      { name: '0', value: kpis.backlogBuckets['0'] },
      { name: '1', value: kpis.backlogBuckets['1'] },
      { name: '2', value: kpis.backlogBuckets['2'] },
      { name: '3+', value: kpis.backlogBuckets['3+'] },
    ]
  }, [kpis])

  // Program Type segmentation
  const programCards = useMemo(() => {
    const map: Record<string, { program: string; total: number; registered: number; eligible: number; placed: number; placementRate: number; totalRate: number }> = {}
    const normalizeProgram = (raw: string | undefined | null): string => {
      const v = String(raw || '').trim().toLowerCase()
      if (!v) return 'Unspecified'
      if (/^ug$/.test(v)) return 'UG'
      if (/^pg$/.test(v)) return 'PG'
      if (/(btech|b\.tech|be|b\.e|bsc|b\.sc|ba|b\.a|bcom|b\.com|bca|bba|undergrad|under\s*graduate|ug)/.test(v)) return 'UG'
      if (/(mtech|m\.tech|me|m\.e|msc|m\.sc|ma|m\.a|mcom|m\.com|mca|mba|postgrad|post\s*graduate|pg)/.test(v)) return 'PG'
      if (/(diploma|poly|polytechnic)/.test(v)) return 'Diploma'
      if (/(phd|doctorate)/.test(v)) return 'PhD'
      return v.toUpperCase()
    }
    studentsAll.forEach((s: ExtendedStudent) => {
      const program = normalizeProgram(s.programType)
      if (!map[program]) map[program] = { program, total: 0, registered: 0, eligible: 0, placed: 0, placementRate: 0, totalRate: 0 }
      map[program].total += 1
      if (s.onboardingCompleted) map[program].registered += 1
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      const isEligible = att >= eligibility.attendanceMin && bl <= eligibility.backlogMax && gpa >= eligibility.cgpaMin
      if (isEligible) map[program].eligible += 1
      if (s.isPlaced) map[program].placed += 1
    })
    Object.values(map).forEach(p => {
      const totalRate = p.total > 0 ? Math.round((p.placed / p.total) * 100) : 0
      // Use totalRate as the main placement rate (more meaningful when eligible count is low)
      p.placementRate = Math.max(0, Math.min(100, totalRate))
      p.totalRate = Math.max(0, Math.min(100, totalRate))
    })
    return Object.values(map).sort((a,b)=>a.program.localeCompare(b.program))
  }, [studentsAll, eligibility])

  // Courses grouped by Program Type (UG/PG) with Total, Eligible, Placed
  const courseByProgram = useMemo(() => {
    const toBucket = (raw: string | undefined | null): 'UG' | 'PG' | 'Other' => {
      const v = String(raw || '').trim().toLowerCase()
      if (!v) return 'Other'
      if (/^ug$/.test(v) || /(btech|b\.tech|be|b\.e|bsc|b\.sc|ba|b\.a|bcom|b\.com|bca|bba|undergrad|under\s*graduate|ug)/.test(v)) return 'UG'
      if (/^pg$/.test(v) || /(mtech|m\.tech|me|m\.e|msc|m\.sc|ma|m\.a|mcom|m\.com|mca|mba|postgrad|post\s*graduate|pg)/.test(v)) return 'PG'
      return 'Other'
    }
    const titleCase = (s: string) => String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    type CourseAgg = { course: string; total: number; eligible: number; placed: number }
    const ug: Record<string, CourseAgg> = {}
    const pg: Record<string, CourseAgg> = {}
    studentsAll.forEach((s: ExtendedStudent) => {
      const bucket = toBucket(s.programType)
      if (bucket === 'Other') return
      const courseName = titleCase((s.course as string) || 'Unspecified')
      const target = bucket === 'UG' ? ug : pg
      if (!target[courseName]) target[courseName] = { course: courseName, total: 0, eligible: 0, placed: 0 }
      const entry = target[courseName]
      entry.total += 1
      const att = s.eligibilityCriteria?.attendancePercentage ?? 0
      const bl = s.eligibilityCriteria?.backlogs ?? 99
      const gpa = s.onboardingData?.academicInfo?.gpa ?? 0
      const isEligible = att >= eligibility.attendanceMin && bl <= eligibility.backlogMax && gpa >= eligibility.cgpaMin
      if (isEligible) entry.eligible += 1
      if (s.isPlaced) entry.placed += 1
    })
    const finalize = (m: Record<string, CourseAgg>) => Object.values(m).sort((a,b)=>a.course.localeCompare(b.course))
    return { UG: finalize(ug), PG: finalize(pg) }
  }, [studentsAll, eligibility.attendanceMin, eligibility.backlogMax, eligibility.cgpaMin])

  // removed additional sections (dept full-width and course-wise)

  

  // legacy CSV export kept for reference but unused; handled by exportData via exportType

  const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g,'""')}"`

  const [exportType, setExportType] = useState<'csv'|'pdf'|'doc'>('csv')
  const exportData = () => {
    const rows = ((allQuery.data?.items as ExtendedStudent[]) || [])
    if (exportType === 'csv') {
      const headers = [
        'Name','Email','Roll No','Department','Course','Year','Section','Program Type',
        'Active','Placed','Attendance%','Backlogs','CGPA',
        'Company Name','Designation','CTC (LPA)','Work Location','Joining Date','Remarks','Offer Letter Link','Placed By','Placed At'
      ]
      const csv = [headers.join(',')]
      rows.forEach((s: ExtendedStudent)=>{
        const placementDetails = s.placementDetails || {}
        csv.push([
          quote(s.name), 
          quote(s.email), 
          quote(s.rollNumber||''), 
          quote(s.branch||''), 
          quote(s.course||''), 
          quote(s.year||''), 
          quote(s.section||''), 
          quote(s.programType||''),
          s.isActive ? 'Active' : 'Blocked', 
          s.isPlaced ? 'Placed' : 'Not Placed',
          s.eligibilityCriteria?.attendancePercentage ?? '', 
          s.eligibilityCriteria?.backlogs ?? '',
          s.onboardingData?.academicInfo?.gpa ?? '',
          // Placement Details
          quote(placementDetails.companyName || ''),
          quote(placementDetails.designation || ''),
          placementDetails.ctc || '',
          quote(placementDetails.workLocation || ''),
          placementDetails.joiningDate ? new Date(placementDetails.joiningDate).toLocaleDateString() : '',
          quote(placementDetails.remarks || ''),
          quote(placementDetails.offerLetterDriveLink || ''),
          quote(placementDetails.placedBy || ''),
          placementDetails.placedAt ? new Date(placementDetails.placedAt).toLocaleDateString() : ''
        ].join(','))
      })
      const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_with_placement_details.csv'
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    // Build comprehensive HTML table for doc/pdf routes
    const htmlRows = rows.map((s: ExtendedStudent)=>{
      const placementDetails = s.placementDetails || {}
      return `
      <tr>
        <td>${s.name||''}</td>
        <td>${s.email||''}</td>
        <td>${s.rollNumber||''}</td>
        <td>${s.branch||''}</td>
        <td>${s.course||''}</td>
        <td>${s.year||''}</td>
        <td>${s.section||''}</td>
        <td>${s.programType||''}</td>
        <td>${s.isActive ? 'Active':'Blocked'}</td>
        <td>${s.isPlaced ? 'Placed':'Not Placed'}</td>
        <td>${s.eligibilityCriteria?.attendancePercentage ?? ''}</td>
        <td>${s.eligibilityCriteria?.backlogs ?? ''}</td>
        <td>${s.onboardingData?.academicInfo?.gpa ?? ''}</td>
        <td>${placementDetails.companyName || ''}</td>
        <td>${placementDetails.designation || ''}</td>
        <td>${placementDetails.ctc || ''}</td>
        <td>${placementDetails.workLocation || ''}</td>
        <td>${placementDetails.joiningDate ? new Date(placementDetails.joiningDate).toLocaleDateString() : ''}</td>
        <td>${placementDetails.remarks || ''}</td>
        <td>${placementDetails.offerLetterDriveLink || ''}</td>
        <td>${placementDetails.placedBy || ''}</td>
        <td>${placementDetails.placedAt ? new Date(placementDetails.placedAt).toLocaleDateString() : ''}</td>
      </tr>`
    }).join('')
    
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Students with Placement Details</title>
      <style>
        body{font-family: Arial, sans-serif; margin: 20px;}
        table{border-collapse: collapse; width: 100%; font-size: 11px;}
        th,td{border:1px solid #e5e7eb; padding:6px; text-align:left; vertical-align:top;}
        th{background:#f8fafc; font-weight:bold; position:sticky; top:0;}
        .placement-section{background:#f0f9ff; border-left:4px solid #3b82f6;}
        .placement-header{background:#dbeafe; font-weight:bold; color:#1e40af;}
        .no-placement{color:#6b7280; font-style:italic;}
        h1{color:#1f2937; margin-bottom:20px;}
        .summary{background:#f9fafb; padding:15px; border-radius:8px; margin-bottom:20px;}
      </style>
    </head><body>
      <h1>Students Export with Placement Details</h1>
      <div class="summary">
        <strong>Export Summary:</strong><br>
        Total Students: ${rows.length}<br>
        Placed Students: ${rows.filter(s => s.isPlaced).length}<br>
        Not Placed: ${rows.filter(s => !s.isPlaced).length}<br>
        Export Date: ${new Date().toLocaleDateString()}
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Roll No</th><th>Department</th><th>Course</th><th>Year</th><th>Section</th><th>Program</th>
            <th>Status</th><th>Placement</th><th>Attendance%</th><th>Backlogs</th><th>CGPA</th>
            <th class="placement-header">Company</th><th class="placement-header">Designation</th><th class="placement-header">CTC (LPA)</th>
            <th class="placement-header">Work Location</th><th class="placement-header">Joining Date</th><th class="placement-header">Remarks</th>
            <th class="placement-header">Offer Letter</th><th class="placement-header">Placed By</th><th class="placement-header">Placed At</th>
          </tr>
        </thead>
        <tbody>${htmlRows}</tbody>
      </table>
    </body></html>`
    
    if (exportType === 'doc') {
      const blob = new Blob([html], { type: 'application/msword' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_with_placement_details.doc'
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
        <div className="px-4 mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Overview Statistics</h2>
          <p className="text-sm text-gray-600">Key performance indicators and student metrics</p>
        </div>
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


        {/* Program Type segmentation (UG/PG/Diploma/etc.) */}
        <div className="px-4 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Program Type Analysis</h2>
          <p className="text-sm text-gray-600">Breakdown by program types (UG, PG, Diploma, etc.)</p>
          <div className="grid grid-cols-1 gap-4">
            {programCards.map((p)=> (
              <div key={p.program} className="bg-white rounded-2xl p-5 border border-accent-200 shadow-subtle">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-brand-text">Program Type: {p.program}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{p.placementRate}% rate</span>
                  </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-center">
                  <div className="bg-accent-100 rounded-xl p-3">
                    <div className="text-[11px] text-secondary-500">Total</div>
                    <div className="mt-1 font-bold text-secondary-800">{p.total}</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="text-[11px] text-secondary-500">Registered</div>
                    <div className="mt-1 font-bold text-secondary-800">{p.registered}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <div className="text-[11px] text-secondary-500">Eligible</div>
                    <div className="mt-1 font-bold text-secondary-800">{p.eligible}</div>
                  </div>
                  <div className="bg-insta-2/10 rounded-xl p-3">
                    <div className="text-[11px] text-secondary-500">Placed</div>
                    <div className="mt-1 font-bold text-secondary-800">{p.placed}</div>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3">
                    <div className="text-[11px] text-secondary-500">Rate (Total)</div>
                    <div className="mt-1 font-bold text-secondary-800">{p.totalRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Courses by Program Type (UG / PG) */}
        <div className="px-4 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Course Analysis</h2>
          <p className="text-sm text-gray-600">Detailed breakdown by individual courses within program types</p>
          {(['UG','PG'] as const).map((bucket) => (
            courseByProgram[bucket].length > 0 ? (
              <div key={bucket} className="space-y-2">
                <div className="text-xs text-secondary-500">{bucket}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {courseByProgram[bucket].map((c) => (
                    <div key={`${bucket}-${c.course}`} className="bg-white rounded-2xl p-4 border border-accent-200 shadow-subtle">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-brand-text">{c.course}</div>
                        <span className="text-[11px] px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">{bucket}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-accent-100 rounded-xl p-3">
                          <div className="text-[11px] text-secondary-500">Total</div>
                          <div className="mt-1 font-bold text-secondary-800">{c.total}</div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3">
                          <div className="text-[11px] text-secondary-500">Eligible</div>
                          <div className="mt-1 font-bold text-secondary-800">{c.eligible}</div>
                        </div>
                        <div className="bg-insta-2/10 rounded-xl p-3">
                          <div className="text-[11px] text-secondary-500">Placed</div>
                          <div className="mt-1 font-bold text-secondary-800">{c.placed}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          ))}
        </div>

        {/* Program Type Segmentation removed as requested */}

        {/* Filters */}
        <div className="mt-6 px-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Filters & Export</h2>
          <p className="text-sm text-gray-600 mb-4">Filter students and export data in various formats</p>
          
          <div className="bg-white rounded-2xl p-6 shadow-subtle border border-accent-200">
            {/* First Layer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input 
                  placeholder="Search by name or roll number" 
                  value={filters.q||''} 
                  onChange={e=>syncUrl({q:e.target.value,page:1})} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select value={filters.batch||''} onChange={e=>syncUrl({batch:e.target.value,page:1})} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All Batches</option>
                  {(filterOptionsQuery.data?.filters.years || []).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select value={filters.course||''} onChange={e=>syncUrl({course:e.target.value,page:1})} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All Courses</option>
                  {(filterOptionsQuery.data?.filters.courses || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={filters.department||''} onChange={e=>syncUrl({department:e.target.value,page:1})} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All Departments</option>
                  {(filterOptionsQuery.data?.filters.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Second Layer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input 
                  placeholder="e.g., A, B, C" 
                  value={filters.section||''} 
                  onChange={e=>syncUrl({section:e.target.value,page:1})} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select value={filters.programType||''} onChange={e=>syncUrl({programType:e.target.value,page:1})} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All Programs</option>
                  {(filterOptionsQuery.data?.filters.programTypes || []).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min CGPA</label>
                <input 
                  placeholder="e.g., 6.0" 
                  value={filters.minCgpa||''} 
                  onChange={e=>syncUrl({minCgpa:e.target.value,page:1})} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Backlogs</label>
                <input 
                  placeholder="e.g., 2" 
                  value={filters.maxBacklogs||''} 
                  onChange={e=>syncUrl({maxBacklogs:e.target.value,page:1})} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
            </div>

            {/* Third Layer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Attendance %</label>
                <input 
                  placeholder="e.g., 75" 
                  value={filters.minAttendance||''} 
                  onChange={e=>syncUrl({minAttendance:e.target.value,page:1})} 
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placement Status</label>
                <select value={filters.placed||''} onChange={e=>syncUrl({placed:e.target.value,page:1})} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All Students</option>
                  <option value="true">Placed</option>
                  <option value="false">Not Placed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <select value={filters.blocked||''} onChange={e=>syncUrl({blocked:e.target.value,page:1})} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">All Status</option>
                  <option value="true">Blocked</option>
                  <option value="false">Active</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                <div className="flex gap-2">
                  <select value={exportType} onChange={e=>setExportType(e.target.value as 'csv'|'pdf'|'doc')} className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                  </select>
                  <button 
                    onClick={exportData} 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    <Download size={16}/>
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Applied Filters */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Applied Filters</h3>
                <button 
                  className="text-sm text-white bg-gray-600 hover:bg-gray-700 rounded-lg px-3 py-1.5 transition-colors" 
                  onClick={()=>syncUrl({ q:'', batch:'', course:'', year:'', department:'', section:'', placed:'', blocked:'', programType:'', minCgpa:'', maxBacklogs:'', minAttendance:'', page:1 })}
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).filter(([k,v])=>!['page','limit'].includes(k) && v && String(v).length>0).map(([k,v])=> (
                  <span key={k} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm">
                    <span className="capitalize font-medium">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-blue-600">{String(v)}</span>
                    <button 
                      className="text-blue-400 hover:text-blue-700 ml-1" 
                      onClick={()=>syncUrl({[k]: ''} as Partial<Filters>)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {Object.entries(filters).filter(([k,v])=>!['page','limit'].includes(k) && v && String(v).length>0).length === 0 && (
                  <span className="text-sm text-gray-500 italic">No filters applied</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Analytics & Charts</h2>
          <p className="text-sm text-gray-600 mb-4">Visual representation of placement data and trends</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
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