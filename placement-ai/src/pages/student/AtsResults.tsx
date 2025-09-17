import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeAtsOnServer, saveAtsScore, submitOnboarding } from '../../global/api'
import { getAuth } from '../../global/auth'
import Layout from '../../components/layout/Layout'

type Draft = {
  desiredRole?: string
  qualification?: string
  gpa?: string
  skillsTech?: string[]
  skillsSoft?: string[]
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  'Software Engineer': ['Data Structures', 'Algorithms', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'SQL'],
  'Full Stack Developer': ['React', 'Node.js', 'Express', 'MongoDB', 'REST', 'TypeScript', 'HTML', 'CSS', 'Git', 'SQL'],
  'Frontend Developer': ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Accessibility', 'Testing'],
  'Backend Developer': ['Node.js', 'Express', 'REST', 'MongoDB', 'SQL', 'Authentication', 'Caching', 'Scalability', 'Testing'],
  'Data Analyst': ['SQL', 'Excel', 'Python', 'Pandas', 'Visualization', 'Tableau', 'Statistics'],
  'DevOps Engineer': ['CI/CD', 'Docker', 'Kubernetes', 'Linux', 'AWS', 'Monitoring', 'Terraform'],
  'QA Engineer': ['Testing', 'Selenium', 'Cypress', 'Automation', 'Bug Tracking'],
  'UI/UX Designer': ['Figma', 'Wireframing', 'Prototyping', 'Accessibility', 'Design Systems'],
  'Machine Learning Engineer': ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'MLOps'],
}

function normalize(str: string) {
  return str.toLowerCase()
}

function computeScores(draft: Draft) {
  const role = draft.desiredRole || 'Software Engineer'
  const roleKeywords = ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Software Engineer']
  const tech = (draft.skillsTech || []).map(s => s.trim()).filter(Boolean)
  const techLower = tech.map(normalize)
  const kwLower = roleKeywords.map(normalize)
  const overlap = kwLower.filter(k => techLower.some(s => s.includes(k) || k.includes(s)))
  const skillsMatch = Math.min(100, Math.round((overlap.length / Math.max(kwLower.length, 1)) * 100))

  // Simple GPA-based academic score
  const gpaNum = parseFloat((draft.gpa || '').replace(/[^0-9.]/g, ''))
  let academic = 60
  if (!isNaN(gpaNum)) {
    // scale 6.0 -> 60, 10.0 -> 95; otherwise percentage 60-95
    if (gpaNum <= 10) academic = Math.min(95, Math.max(50, Math.round((gpaNum / 10) * 95)))
    if (gpaNum > 10) academic = Math.min(95, Math.max(50, Math.round(gpaNum)))
  }

  const keywordRelevance = Math.min(100, Math.round(skillsMatch * 1.0))
  const formatting = 78 // placeholder until we parse resume
  const grammar = 75 // placeholder

  // Weight by role: emphasize skills and keywords
  const overall = Math.round(
    0.2 * academic +
    0.4 * skillsMatch +
    0.3 * keywordRelevance +
    0.05 * formatting +
    0.05 * grammar
  )

  const suggestions: string[] = []
  if (skillsMatch < 80) suggestions.push(`Add role keywords: ${roleKeywords.slice(0, 6).join(', ')}`)
  if (academic < 70) suggestions.push('Highlight relevant coursework and projects to strengthen academics')
  if (formatting < 85) suggestions.push('Use consistent fonts, clear sections, and concise bullets')
  if (grammar < 85) suggestions.push('Proofread for grammar and use stronger action verbs')

  return {
    role,
    overall,
    breakdown: {
      academic,
      skillsMatch,
      formatting,
      keywordRelevance,
      grammar,
    },
    suggestions,
    matched: overlap,
    missing: kwLower.filter(k => !overlap.includes(k)).slice(0, 6),
  }
}

export default function StudentAtsResults() {
  const navigate = useNavigate()
  // removed unused sidebar state
  const draft: Draft = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('onboarding_draft') || '{}') } catch { return {} }
  }, [])
  const [serverAnalysis, setServerAnalysis] = useState<ReturnType<typeof computeScores> | null>(null)
  const analysis = useMemo(() => serverAnalysis || computeScores(draft), [serverAnalysis, draft])
  const [score, setScore] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setScore(Math.min(analysis.overall, 85)), 300)
    return () => clearTimeout(t)
  }, [analysis.overall])

  useEffect(() => {
    const auth = getAuth()
    const token = auth?.token as string
    analyzeAtsOnServer({ role: draft.desiredRole, skillsTech: draft.skillsTech, gpa: draft.gpa }, token)
      .then(res => setServerAnalysis(res.result as any))
      .catch(() => setServerAnalysis(null))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const auth = getAuth()
    const token = auth?.token as string
    saveAtsScore({
      role: analysis.role,
      overall: analysis.overall,
      breakdown: analysis.breakdown,
      matched: analysis.matched,
      missing: analysis.missing,
    }, token).catch(() => {})
  }, [analysis])

  async function handleSaveAll() {
    try {
      setSaving(true)
      const auth = getAuth()
      const token = auth?.token as string
      // Persist full onboarding draft as profile info (send all known fields)
      const fullDraft = (() => { try { return JSON.parse(localStorage.getItem('onboarding_draft') || '{}') } catch { return {} } })() as Record<string, any>
      const payload: Record<string, any> = {
        qualification: fullDraft.qualification || draft.qualification || '',
        college: fullDraft.college || '',
        gradYear: fullDraft.gradYear || '',
        gpa: fullDraft.gpa || draft.gpa || '',
        coursework: fullDraft.coursework || '',
        skillsTech: Array.isArray(fullDraft.skillsTech) ? fullDraft.skillsTech : (draft.skillsTech || []),
        skillsSoft: Array.isArray(fullDraft.skillsSoft) ? fullDraft.skillsSoft : (draft.skillsSoft || []),
        expRole: fullDraft.expRole || '',
        expCompany: fullDraft.expCompany || '',
        expDuration: fullDraft.expDuration || '',
        expResp: fullDraft.expResp || '',
        desiredRole: fullDraft.desiredRole || draft.desiredRole || '',
        industries: fullDraft.industries || '',
        locations: fullDraft.locations || '',
        salary: fullDraft.salary || '',
        jobType: fullDraft.jobType || '',
      }
      await submitOnboarding(payload, token)
      // Ensure ATS score is saved
      await saveAtsScore({
        role: analysis.role,
        overall: analysis.overall,
        breakdown: analysis.breakdown,
        matched: analysis.matched,
        missing: analysis.missing,
      }, token)
      // Mark onboarded locally and go to dashboard
      try { localStorage.setItem('student_onboarded', 'true') } catch {}
      navigate('/student', { replace: true })
    } catch (e) {
      alert((e as Error).message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="ATS Results">
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar and main content replaced by Layout */}
        <div className="lg:ml-64 min-h-screen">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Your Job Readiness Score</h1>
                  <p className="text-gray-600">Role-targeted insights for {analysis.role}</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
                Note: ATS analysis is in active development. Scores are approximate and may occasionally be inaccurate. Use this as guidance, not an absolute measure.
              </div>
            </div>
          </header>
          {/* Page Content */}
          <main className="p-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1 bg-white rounded-xl shadow p-6 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                      <circle cx="50" cy="50" r="45" strokeWidth="10" fill="none"
                        stroke="url(#grad)" strokeDasharray={`${Math.max(1, score)} 283`} transform="rotate(-90 50 50)" />
                      <defs>
                        <linearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#F58529" />
                          <stop offset="40%" stopColor="#DD2A7B" />
                          <stop offset="70%" stopColor="#8134AF" />
                          <stop offset="100%" stopColor="#515BD4" />
                        </linearGradient>
                      </defs>
                      <text x="50" y="54" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{Math.min(score, 85)}/100</text>
                    </svg>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 text-center">Scores above 85 are displayed as 85.</p>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Academic Match', score: analysis.breakdown.academic },
                    { title: 'Skills Match', score: analysis.breakdown.skillsMatch },
                    { title: 'Resume Formatting', score: analysis.breakdown.formatting },
                    { title: 'Keyword Relevance', score: analysis.breakdown.keywordRelevance },
                    { title: 'Grammar & Readability', score: analysis.breakdown.grammar },
                  ].map((c) => (
                    <div key={c.title} className="bg-white rounded-xl shadow p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{c.title}</p>
                        <span className="text-sm font-semibold bg-gradient-to-r from-insta-1 via-insta-2 to-insta-4 bg-clip-text text-transparent">{c.score}/100</span>
                      </div>
                      <div className="mt-3 h-2 bg-gray-200 rounded-full">
                        <div className="h-2 rounded-full bg-gradient-to-r from-insta-1 via-insta-2 to-insta-4" style={{ width: `${c.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
                  <h2 className="font-semibold text-gray-900">Detailed Feedback</h2>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                  <div className="mt-4 text-sm">
                    <p className="font-medium text-gray-900">Resume Issues</p>
                    <ul className="mt-2 list-disc ml-5 text-gray-700 space-y-1">
                      {analysis.missing.map((k) => (
                        <li key={k}>Consider adding keyword: <span className="font-medium">{k}</span></li>
                      ))}
                      {analysis.breakdown.formatting < 85 && (
                        <li>Improve formatting consistency (headings, spacing, bullet clarity)</li>
                      )}
                      {analysis.breakdown.grammar < 85 && (
                        <li>Proofread for grammar and use stronger action verbs</li>
                      )}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <button onClick={handleSaveAll} disabled={saving} className="px-5 py-2.5 rounded-lg text-white bg-gradient-to-r from-insta-1 via-insta-2 to-insta-4 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  )
}


