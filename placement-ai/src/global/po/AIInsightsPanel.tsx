"use client"

import { useMemo, useState } from "react"
import { Download, Send, Bot, BarChart3, Users, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import type { MatchCandidate } from "@/types"

interface AIInsightsPanelProps {
  requestId: string
  role: string
  companyName: string
  candidates: MatchCandidate[]
  onShare?: (opts?: { messageOverride?: string }) => Promise<void>
}

export function AIInsightsPanel({ requestId: _requestId, role, companyName, candidates, onShare }: AIInsightsPanelProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const stats = useMemo(() => {
    if (!candidates?.length) return null
    const total = candidates.length
    const avgCgpa = candidates.reduce((s, c) => s + (c.cgpa || 0), 0) / total
    const avgMatch = candidates.reduce((s, c) => s + (c.match || 0), 0) / total
    const deptMap = new Map<string, number>()
    const skillsMap = new Map<string, number>()
    let ats80 = 0

    for (const c of candidates) {
      deptMap.set(c.dept, (deptMap.get(c.dept) || 0) + 1)
      if (c.ats >= 80) ats80 += 1
      for (const s of c.skills || []) skillsMap.set(s, (skillsMap.get(s) || 0) + 1)
    }

    const topDepts = Array.from(deptMap.entries()).sort((a,b) => b[1]-a[1]).slice(0,3)
    const topSkills = Array.from(skillsMap.entries()).sort((a,b) => b[1]-a[1]).slice(0,6)
    const diversityIndex = Math.min(100, Math.round((topDepts.length / Math.max(1, deptMap.size)) * 100))

    return { total, avgCgpa, avgMatch, topDepts, topSkills, ats80, diversityIndex }
  }, [candidates])

  const aiBrief = useMemo(() => {
    if (!stats) return ""
    const skills = stats.topSkills.map(([s, n]) => `${s}(${n})`).join(", ")
    const depts = stats.topDepts.map(([d, n]) => `${d}(${n})`).join(", ")
    return `Shortlist AI Brief for ${companyName} - ${role}\n\n` +
      `Candidates: ${stats.total}\n` +
      `Avg Match: ${stats.avgMatch.toFixed(0)}% | Avg CGPA: ${stats.avgCgpa.toFixed(2)}\n` +
      `ATS≥80: ${stats.ats80}\n` +
      `Top Depts: ${depts}\n` +
      `Top Skills: ${skills}\n` +
      `Diversity Index: ${stats.diversityIndex}%\n\n` +
      `Notes: Candidates demonstrate strong alignment with ${role}. Suggested next step: schedule coding + behavioral rounds within 7 days.`
  }, [stats, role, companyName])

  const handleExport = async () => {
    try {
      setIsExporting(true)
      // TODO: Replace with real export call
      await new Promise(r => setTimeout(r, 800))
      toast({ title: "Export ready", description: "Insights exported as PDF (mock)" })
    } catch (e) {
      toast({ title: "Export failed", description: "Please try again", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    if (!onShare) return
    try {
      setIsSharing(true)
      await onShare({ messageOverride: aiBrief })
      toast({ title: "Shared", description: "AI brief sent to company" })
    } catch (e) {
      toast({ title: "Share failed", description: "Please try again", variant: "destructive" })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Insights
        </CardTitle>
        <CardDescription>
          Smart summary for {companyName} • {role}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!stats ? (
          <div className="text-sm text-gray-500">No candidates selected yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-700">Avg Match</div>
                <div className="text-xl font-semibold text-blue-900">{stats.avgMatch.toFixed(0)}%</div>
                <Progress value={Math.min(100, stats.avgMatch)} className="mt-1" />
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-green-700">Avg CGPA</div>
                <div className="text-xl font-semibold text-green-900">{stats.avgCgpa.toFixed(2)}</div>
                <Progress value={Math.min(100, stats.avgCgpa * 10)} className="mt-1" />
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xs text-purple-700">ATS ≥ 80</div>
                <div className="text-xl font-semibold text-purple-900">{stats.ats80}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="text-xs text-amber-700">Diversity Index</div>
                <div className="text-xl font-semibold text-amber-900">{stats.diversityIndex}%</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Top Skills
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.topSkills.map(([s, n]) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s} • {n}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> Top Departments
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.topDepts.map(([d, n]) => (
                  <Badge key={d} variant="outline" className="text-xs">{d} • {n}</Badge>
                ))}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-md text-xs whitespace-pre-wrap border">{aiBrief}</div>

            <div className="flex gap-2">
              <Button onClick={handleShare} disabled={isSharing} className="flex-1">
                {isSharing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Share with Company
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={isExporting} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Summary excludes PII. Links are secure.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
