import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { createNotification, getNotificationFilters, previewRecipients, type CreateNotificationPayload, listNotifications, updateNotification, deleteNotification } from '../../global/api'
import { getAuth } from '../../global/auth'
import { useToast } from '../../hooks/use-toast'

export default function OfficerNotificationsPage() {
  const { toast } = useToast()
  const auth = getAuth()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [years, setYears] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [sections, setSections] = useState<string[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [targetAll, setTargetAll] = useState(true)
  const [links, setLinks] = useState<Array<{ label?: string; url: string }>>([])
  const [attachments, setAttachments] = useState<Array<{ filename: string; url: string; mimeType?: string; size?: number }>>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)

  const [yearOptions, setYearOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [sectionOptions, setSectionOptions] = useState<string[]>([])
  const [specializationOptions, setSpecializationOptions] = useState<string[]>([])
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [existing, setExisting] = useState<Array<{ _id: string; title: string; message: string; createdAt: string }>>([])
  const [loadingList, setLoadingList] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await getNotificationFilters(auth?.token)
        setYearOptions(res.filters.years || [])
        setDepartmentOptions(res.filters.departments || [])
        setSectionOptions(res.filters.sections || [])
        setSpecializationOptions(res.filters.specializations || [])
      } catch (e) {
        // ignore; page still usable
      }
    })()
  }, [])

  const loadExisting = async () => {
    try {
      setLoadingList(true)
      const res = await listNotifications(auth?.token)
      const items = (res.items || []).map((n: any) => ({ _id: n._id, title: n.title, message: n.message, createdAt: n.createdAt }))
      setExisting(items)
    } catch {
      setExisting([])
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadExisting()
  }, [])

  const targetSummary = useMemo(() => {
    if (targetAll) return 'All active students'
    const parts: string[] = []
    if (years.length) parts.push(`Years: ${years.join(', ')}`)
    if (departments.length) parts.push(`Depts: ${departments.join(', ')}`)
    if (sections.length) parts.push(`Sections: ${sections.join(', ')}`)
    if (specializations.length) parts.push(`Specs: ${specializations.join(', ')}`)
    return parts.join(' • ') || 'No filters selected'
  }, [targetAll, years, departments, sections, specializations])

  useEffect(() => {
    (async () => {
      try {
        const target = targetAll ? { all: true } : { years, departments, sections, specializations }
        const res = await previewRecipients(auth?.token, target)
        setRecipientCount(res.recipientCount)
      } catch {
        setRecipientCount(null)
      }
    })()
  }, [targetAll, years, departments, sections, specializations])

  const addLink = () => setLinks([...links, { url: '' }])
  const removeLink = (idx: number) => setLinks(links.filter((_, i) => i !== idx))
  const updateLink = (idx: number, field: 'label' | 'url', value: string) => {
    setLinks((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const addAttachment = () => setAttachments([...attachments, { filename: '', url: '' }])
  const removeAttachment = (idx: number) => setAttachments(attachments.filter((_, i) => i !== idx))
  const updateAttachment = (idx: number, field: 'filename' | 'url' | 'mimeType', value: string) => {
    setAttachments((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a))
  }

  const validate = () => {
    if (!title.trim()) return 'Title is required'
    if (!message.trim()) return 'Message is required'
    if (!targetAll && !years.length && !departments.length && !sections.length && !specializations.length) {
      return 'Select at least one target filter or choose All'
    }
    const badLink = links.find(l => !l.url.trim())
    if (badLink) return 'All links must have a URL'
    const badAtt = attachments.find(a => !a.url.trim())
    if (badAtt) return 'All attachments must have a URL'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) {
      toast({ title: 'Validation error', description: err, variant: 'destructive' })
      return
    }
    try {
      setSubmitting(true)
      const payload: CreateNotificationPayload = {
        title: title.trim(),
        message: message.trim(),
        links: links.filter(l => l.url.trim()),
        attachments: attachments.filter(a => a.url.trim()),
        target: targetAll ? { all: true } : {
          years,
          departments,
          sections,
          specializations
        },
        sendEmail
      }
      const res = await createNotification(auth?.token, payload)
      toast({ title: 'Notification sent', description: `Delivered to ${res.recipientCount} students.` })
      setTitle('')
      setMessage('')
      setYears([])
      setDepartments([])
      setSections([])
      setSpecializations([])
      setLinks([])
      setAttachments([])
      setTargetAll(true)
      setSendEmail(false)
      loadExisting()
    } catch (e: any) {
      toast({ title: 'Failed to send', description: e?.message || 'Unexpected error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (n: { _id: string; title: string; message: string }) => {
    setEditingId(n._id)
    setTitle(n.title)
    setMessage(n.message)
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      const res = await updateNotification(auth?.token, editingId, {
        title: title.trim(),
        message: message.trim(),
        links,
        attachments,
      })
      toast({ title: 'Updated', description: res.message })
      setEditingId(null)
      setTitle('')
      setMessage('')
      setLinks([])
      setAttachments([])
      loadExisting()
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Unexpected error', variant: 'destructive' })
    }
  }

  const removeNotification = async (id: string) => {
    try {
      await deleteNotification(auth?.token, id)
      toast({ title: 'Deleted', description: 'Notification removed' })
      loadExisting()
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Unexpected error', variant: 'destructive' })
    }
  }

  const MultiSelect = ({ label, options, values, setValues }: { label: string, options: string[], values: string[], setValues: (v: string[]) => void }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = values.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => setValues(selected ? values.filter(v => v !== opt) : [...values, opt])} className={`px-3 py-1 rounded-full border ${selected ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-gray-200 text-gray-700'}`}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Push Notifications</h1>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Placement Drive Update" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[120px]" placeholder="Write the notification message..." />
          </div>
          <div className="flex items-center gap-3">
            <input id="all" type="checkbox" checked={targetAll} onChange={(e) => setTargetAll(e.target.checked)} />
            <label htmlFor="all" className="text-sm text-gray-700">Send to all active students</label>
          </div>
          {!targetAll && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelect label="Years/Batches" options={yearOptions} values={years} setValues={setYears} />
              <MultiSelect label="Departments" options={departmentOptions} values={departments} setValues={setDepartments} />
              <MultiSelect label="Sections" options={sectionOptions} values={sections} setValues={setSections} />
              <MultiSelect label="Specializations" options={specializationOptions} values={specializations} setValues={setSpecializations} />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Links</label>
              <button type="button" onClick={addLink} className="text-sm text-primary-600">Add link</button>
            </div>
            <div className="space-y-2">
              {links.map((l, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input value={l.label || ''} onChange={(e) => updateLink(i, 'label', e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Label (optional)" />
                  <input value={l.url} onChange={(e) => updateLink(i, 'url', e.target.value)} className="md:col-span-2 border rounded-lg px-3 py-2" placeholder="https://..." />
                  <button type="button" onClick={() => removeLink(i)} className="text-sm text-red-600">Remove</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Attachments</label>
              <button type="button" onClick={addAttachment} className="text-sm text-primary-600">Add attachment</button>
            </div>
            <div className="space-y-2">
              {attachments.map((a, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input value={a.filename} onChange={(e) => updateAttachment(i, 'filename', e.target.value)} className="border rounded-lg px-3 py-2" placeholder="Filename" />
                  <input value={a.url} onChange={(e) => updateAttachment(i, 'url', e.target.value)} className="md:col-span-2 border rounded-lg px-3 py-2" placeholder="https://..." />
                  <button type="button" onClick={() => removeAttachment(i)} className="text-sm text-red-600">Remove</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Target: {targetSummary}{recipientCount !== null && (<span className="ml-2 text-gray-500">• {recipientCount} recipients</span>)}</div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 mr-2">
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                Also send via email
              </label>
              <button type="button" onClick={() => setPreviewOpen(true)} className="px-4 py-2 rounded-lg border">Preview</button>
              {editingId ? (
                <>
                  <button type="button" onClick={saveEdit} className="px-4 py-2 rounded-lg bg-primary-600 text-white">Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setTitle(''); setMessage(''); setLinks([]); setAttachments([]); }} className="px-4 py-2 rounded-lg border">Cancel</button>
                </>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50">{submitting ? 'Sending…' : 'Send'}</button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">All Notifications</h2>
            <button type="button" onClick={loadExisting} className="text-sm text-primary-600">Refresh</button>
          </div>
          {loadingList ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="divide-y">
              {existing.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications yet.</p>
              ) : (
                existing.map((n) => (
                  <div key={n._id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{n.title}</div>
                      <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.message}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      <button type="button" onClick={() => startEdit(n)} className="px-3 py-1.5 rounded-lg border">Edit</button>
                      <button type="button" onClick={() => removeNotification(n._id)} className="px-3 py-1.5 rounded-lg border text-red-600">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {previewOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-xl space-y-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="p-4 rounded-lg border bg-gray-50">
                <h4 className="text-base font-semibold">{title || '(No title)'}</h4>
                <p className="mt-2 whitespace-pre-wrap">{message || '(No message)'}</p>
                {!!links.length && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium">Links</div>
                    <ul className="list-disc ml-5">
                      {links.map((l, i) => (<li key={i}>{l.label ? `${l.label}: ` : ''}{l.url}</li>))}
                    </ul>
                  </div>
                )}
                {!!attachments.length && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium">Attachments</div>
                    <ul className="list-disc ml-5">
                      {attachments.map((a, i) => (<li key={i}>{a.filename || a.url}</li>))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPreviewOpen(false)} className="px-4 py-2 rounded-lg border">Close</button>
                <button type="button" onClick={() => { setPreviewOpen(false); handleSubmit() }} disabled={submitting} className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50">{submitting ? 'Sending…' : 'Send'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}


