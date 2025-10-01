import { useState, useEffect } from 'react'
import { createOfficer, createCoordinator, getStudentFilterOptions } from '../../global/api'
import Layout from '../../components/layout/Layout'

export default function CreateOfficerPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isCoordinator, setIsCoordinator] = useState(false)
  const [department, setDepartment] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Load department options (derived from student departments)
  useEffect(() => {
    getStudentFilterOptions().then(res => {
      const list = res?.filters?.departments || []
      setDepartments(list)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!name || !email) {
      setMessage('Name and Email are required')
      return
    }
    if (isCoordinator && !department) {
      setMessage('Please select a department for coordinator')
      return
    }
    try {
      setSubmitting(true)
      const res = isCoordinator
        ? await createCoordinator({ name, email, department })
        : await createOfficer({ name, email })
      const ok = (res as any)?.success !== false
      if (ok) {
        setMessage(isCoordinator ? 'Coordinator registered. Credentials emailed.' : 'Officer registered. Credentials emailed.')
        setName('')
        setEmail('')
        setDepartment('')
        setIsCoordinator(false)
      } else {
        setMessage('Failed to register')
      }
    } catch (err: any) {
      setMessage(err?.message || 'Failed to register officer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      title="Register Officer / Coordinator"
      subtitle="Create a new placement officer or department-wise coordinator. Login credentials will be emailed automatically."
    >
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <input id="coordinatorToggle" type="checkbox" checked={isCoordinator} onChange={e => setIsCoordinator(e.target.checked)} />
            <label htmlFor="coordinatorToggle" className="text-sm text-gray-700">Create as Placement Coordinator (department-wise)</label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Officer name" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="officer@college.edu" />
          </div>
          {isCoordinator && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
          {message && <p className="text-sm text-gray-700">{message}</p>}
          <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-secondary text-white rounded-lg disabled:opacity-50">{submitting ? 'Creating…' : isCoordinator ? 'Create Coordinator' : 'Create Officer'}</button>
        </form>
      </div>
    </Layout>
  )
}
