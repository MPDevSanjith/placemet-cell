import { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { createCoordinator, getStudentFilterOptions } from '../../global/api'

export default function CreateCoordinatorPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    getStudentFilterOptions().then(res => {
      const list = res?.filters?.departments || []
      setDepartments(list)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!name || !email || !department) {
      setMessage('Name, Email and Department are required')
      return
    }
    try {
      setSubmitting(true)
      const res = await createCoordinator({ name, email, department })
      const ok = (res as any)?.success !== false
      if (ok) {
        setMessage('Coordinator registered. Credentials emailed.')
        setName('')
        setEmail('')
        setDepartment('')
      } else {
        setMessage('Failed to register coordinator')
      }
    } catch (err: any) {
      setMessage(err?.message || 'Failed to register coordinator')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      title="Register Placement Coordinator"
      subtitle="Create a new department-wise coordinator. Login credentials will be emailed automatically."
    >
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Coordinator name" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="coordinator@college.edu" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {message && <p className="text-sm text-gray-700">{message}</p>}
          <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-secondary text-white rounded-lg disabled:opacity-50">{submitting ? 'Creating…' : 'Create Coordinator'}</button>
        </form>
      </div>
    </Layout>
  )
}


