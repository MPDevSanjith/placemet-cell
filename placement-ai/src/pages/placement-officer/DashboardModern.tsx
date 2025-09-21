// import React from 'react'
// import { motion } from 'framer-motion'
// import { 
//   Users, 
//   Building2, 
//   Briefcase, 
//   TrendingUp, 
//   FileText, 
//   Calendar,
//   Award,
//   Target,
//   BarChart3,
//   UserPlus,
//   Upload,
//   MessageSquare,
//   Bell,
//   Settings,
//   Eye,
//   CheckCircle,
//   Clock,
//   AlertCircle
// } from 'lucide-react'

// const DashboardModern = () => {
//   // Mock data for the dashboard
//   const stats = [
//     {
//       title: 'Total Students',
//       value: '1,247',
//       change: '+12%',
//       changeType: 'positive',
//       icon: Users,
//       gradient: 'from-blue-500 to-purple-600'
//     },
//     {
//       title: 'Active Companies',
//       value: '89',
//       change: '+5%',
//       changeType: 'positive',
//       icon: Building2,
//       gradient: 'from-green-500 to-teal-600'
//     },
//     {
//       title: 'Job Postings',
//       value: '156',
//       change: '+23%',
//       changeType: 'positive',
//       icon: Briefcase,
//       gradient: 'from-orange-500 to-red-600'
//     },
//     {
//       title: 'Placements',
//       value: '234',
//       change: '+18%',
//       changeType: 'positive',
//       icon: Award,
//       gradient: 'from-purple-500 to-pink-600'
//     }
//   ]

//   const recentActivities = [
//     {
//       id: 1,
//       type: 'student',
//       message: 'New student registration: John Doe',
//       time: '2 minutes ago',
//       icon: UserPlus,
//       color: 'text-blue-500'
//     },
//     {
//       id: 2,
//       type: 'company',
//       message: 'TechCorp posted 3 new job openings',
//       time: '15 minutes ago',
//       icon: Building2,
//       color: 'text-green-500'
//     },
//     {
//       id: 3,
//       type: 'placement',
//       message: 'Sarah Wilson placed at Google',
//       time: '1 hour ago',
//       icon: Award,
//       color: 'text-purple-500'
//     },
//     {
//       id: 4,
//       type: 'resume',
//       message: '25 new resumes uploaded today',
//       time: '2 hours ago',
//       icon: FileText,
//       color: 'text-orange-500'
//     }
//   ]

//   const quickActions = [
//     {
//       title: 'Add Student',
//       description: 'Register new student',
//       icon: UserPlus,
//       color: 'bg-blue-500',
//       href: '/placement-officer/students'
//     },
//     {
//       title: 'Post Job',
//       description: 'Create job posting',
//       icon: Briefcase,
//       color: 'bg-green-500',
//       href: '/placement-officer/jobs'
//     },
//     {
//       title: 'Upload Data',
//       description: 'Bulk data upload',
//       icon: Upload,
//       color: 'bg-purple-500',
//       href: '/placement-officer/bulk-upload'
//     },
//     {
//       title: 'View Analytics',
//       description: 'Dashboard insights',
//       icon: BarChart3,
//       color: 'bg-orange-500',
//       href: '/placement-officer/analytics'
//     }
//   ]

//   const upcomingEvents = [
//     {
//       title: 'Campus Recruitment Drive',
//       company: 'Microsoft',
//       date: 'Tomorrow, 10:00 AM',
//       status: 'confirmed',
//       participants: 45
//     },
//     {
//       title: 'Interview Session',
//       company: 'Amazon',
//       date: 'Friday, 2:00 PM',
//       status: 'pending',
//       participants: 23
//     },
//     {
//       title: 'Company Presentation',
//       company: 'Google',
//       date: 'Next Monday, 11:00 AM',
//       status: 'confirmed',
//       participants: 67
//     }
//   ]

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
//       {/* Header Section */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="mb-8"
//       >
//         <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-4xl font-bold mb-2">Placement Dashboard</h1>
//               <p className="text-blue-100 text-lg">Welcome back! Here's what's happening today.</p>
//             </div>
//             <div className="hidden md:block">
//               <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
//                 <div className="text-center">
//                   <div className="text-2xl font-bold">89%</div>
//                   <div className="text-sm text-blue-100">Success Rate</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.div>

//       {/* Stats Grid */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.1 }}
//         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
//       >
//         {stats.map((stat, index) => {
//           const Icon = stat.icon
//           return (
//             <motion.div
//               key={stat.title}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 + index * 0.1 }}
//               className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}`}>
//                   <Icon className="w-6 h-6 text-white" />
//                 </div>
//                 <div className={`text-sm font-medium ${
//                   stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
//                 }`}>
//                   {stat.change}
//                 </div>
//               </div>
//               <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
//               <div className="text-gray-600 text-sm">{stat.title}</div>
//             </motion.div>
//           )
//         })}
//       </motion.div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Recent Activities */}
//         <motion.div
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ delay: 0.2 }}
//           className="lg:col-span-2"
//         >
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-2xl font-bold text-gray-900">Recent Activities</h2>
//               <Bell className="w-6 h-6 text-gray-500" />
//             </div>
//             <div className="space-y-4">
//               {recentActivities.map((activity, index) => {
//                 const Icon = activity.icon
//                 return (
//                   <motion.div
//                     key={activity.id}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.3 + index * 0.1 }}
//                     className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200"
//                   >
//                     <div className={`p-2 rounded-lg bg-gray-100 ${activity.color}`}>
//                       <Icon className="w-5 h-5" />
//                     </div>
//                     <div className="flex-1">
//                       <p className="text-gray-900 font-medium">{activity.message}</p>
//                       <p className="text-gray-500 text-sm">{activity.time}</p>
//                     </div>
//                   </motion.div>
//                 )
//               })}
//             </div>
//           </div>
//         </motion.div>

//         {/* Quick Actions */}
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ delay: 0.3 }}
//         >
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-6">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
//             <div className="space-y-3">
//               {quickActions.map((action, index) => {
//                 const Icon = action.icon
//                 return (
//                   <motion.button
//                     key={action.title}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.4 + index * 0.1 }}
//                     className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50/50 transition-all duration-200 group"
//                   >
//                     <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
//                       <Icon className="w-5 h-5 text-white" />
//                     </div>
//                     <div className="text-left">
//                       <p className="font-medium text-gray-900">{action.title}</p>
//                       <p className="text-sm text-gray-500">{action.description}</p>
//                     </div>
//                   </motion.button>
//                 )
//               })}
//             </div>
//           </div>

//           {/* Upcoming Events */}
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
//             <div className="space-y-4">
//               {upcomingEvents.map((event, index) => (
//                 <motion.div
//                   key={index}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.5 + index * 0.1 }}
//                   className="p-4 rounded-xl border border-gray-200/50 hover:border-blue-300/50 transition-colors duration-200"
//                 >
//                   <div className="flex items-start justify-between mb-2">
//                     <h3 className="font-medium text-gray-900">{event.title}</h3>
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                       event.status === 'confirmed' 
//                         ? 'bg-green-100 text-green-700' 
//                         : 'bg-yellow-100 text-yellow-700'
//                     }`}>
//                       {event.status}
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-600 mb-1">{event.company}</p>
//                   <div className="flex items-center justify-between text-sm text-gray-500">
//                     <span className="flex items-center gap-1">
//                       <Calendar className="w-4 h-4" />
//                       {event.date}
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <Users className="w-4 h-4" />
//                       {event.participants}
//                     </span>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   )
// }

// export default DashboardModern



import { useMemo, useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
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

  // Debounced search for better performance
  const [searchDraft, setSearchDraft] = useState(filters.q || '')
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchDraft !== filters.q) {
        syncUrl({ q: searchDraft, page: 1 })
      }
    }, 500) // 500ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [searchDraft])

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
    
    // Calculate placement rates
    const overallPlacementRate = total > 0 ? Math.round((placed / total) * 100) : 0
    const eligiblePlacementRate = eligible > 0 ? Math.round((placed / eligible) * 100) : 0
    
    // Use overall placement rate as the main metric (more meaningful when eligible count is low)
    const placementRate = overallPlacementRate
    
    const backlogBuckets = {
      '0': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 0).length,
      '1': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 1).length,
      '2': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) === 2).length,
      '3+': studentsAll.filter(s => (s.eligibilityCriteria?.backlogs ?? 0) >= 3).length,
    }
    return { 
      total, 
      eligible, 
      placed, 
      blocked, 
      active, 
      placementRate, 
      overallPlacementRate,
      eligiblePlacementRate,
      backlogBuckets 
    }
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
    <Layout>
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
            <input placeholder="Search" value={searchDraft} onChange={e=>setSearchDraft(e.target.value)} className="border rounded-lg px-3 py-2" />
            <input placeholder="Batch" value={filters.batch||''} onChange={e=>syncUrl({batch:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
            <input placeholder="Course" value={filters.course||''} onChange={e=>syncUrl({course:e.target.value,page:1})} className="border rounded-lg px-3 py-2" />
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