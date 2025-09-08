import { useState } from 'react'
import { createOfficer } from '../../global/api'
import Layout from '../../components/layout/Layout'

export default function CreateOfficerPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!name || !email) {
      setMessage('Name and Email are required')
      return
    }
    try {
      setSubmitting(true)
      const res = await createOfficer({ name, email })
      if (res.success) {
        setMessage('Officer registered. Credentials emailed.')
        setName('')
        setEmail('')
      } else {
        setMessage('Failed to register officer')
      }
    } catch (err: any) {
      setMessage(err?.message || 'Failed to register officer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      title="Register Placement Officer"
      subtitle="Create a new officer account. Login credentials will be emailed automatically."
    >
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Officer name" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="officer@college.edu" />
          </div>
          {message && <p className="text-sm text-gray-700">{message}</p>}
          <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-secondary text-white rounded-lg disabled:opacity-50">{submitting ? 'Creating…' : 'Create & Email Login'}</button>
        </form>
      </div>
    </Layout>
  )
}
