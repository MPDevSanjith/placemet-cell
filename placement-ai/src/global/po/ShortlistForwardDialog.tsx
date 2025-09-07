"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Mail, MessageCircle, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
// cn imported by ui components; local import not used
// import { cn } from "@/lib/utils"
import type { MatchCandidate } from "@/types"

interface ShortlistForwardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortlistId: string
  candidates: MatchCandidate[]
  companyName: string
  role: string
}

export function ShortlistForwardDialog({
  open,
  onOpenChange,
  shortlistId,
  candidates,
  companyName,
  role
}: ShortlistForwardDialogProps) {
  const [channels, setChannels] = useState<("email" | "whatsapp")[]>(["email"])
  const [isForwarding, setIsForwarding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    pdfUrl: string
    secureLink: string
    delivered: { email: boolean; whatsapp: boolean }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleForward = async () => {
    setIsForwarding(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 20, 90))
      }, 500)

      // TODO: Replace with actual API call
      const response = await fetch(`/api/po/shortlists/${shortlistId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels })
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error("Failed to forward shortlist")
      }

      const data = await response.json()
      setResult(data)

      // Simulate delivery status updates
      setTimeout(() => {
        // Update delivery status based on channels
        if (channels.includes("email")) {
          // Simulate email delivery
        }
        if (channels.includes("whatsapp")) {
          // Simulate WhatsApp delivery
        }
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsForwarding(false)
    }
  }

  const toggleChannel = (channel: "email" | "whatsapp") => {
    setChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Forward Shortlist to Company
          </DialogTitle>
          <DialogDescription>
            Send the shortlist for <strong>{role}</strong> at <strong>{companyName}</strong> via your preferred channels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Channel Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Select Channels</h4>
            <div className="flex gap-3">
              <Button
                variant={channels.includes("email") ? "default" : "outline"}
                onClick={() => toggleChannel("email")}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                variant={channels.includes("whatsapp") ? "default" : "outline"}
                onClick={() => toggleChannel("whatsapp")}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Candidates Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Candidates ({candidates.length})</h4>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {candidates.map((candidate) => (
                <div key={candidate.studentId} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-sm font-medium">{candidate.name}</span>
                  <Badge variant="secondary">{candidate.match}%</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {isForwarding && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Preparing package...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Shortlist forwarded successfully! Package generated and sent via selected channels.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Online
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Secure Link: <span className="font-mono text-xs">{result.secureLink}</span></p>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isForwarding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={isForwarding || channels.length === 0}
            className="flex items-center gap-2"
          >
            {isForwarding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Forwarding...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Forward Shortlist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
