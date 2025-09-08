import { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'

export default function StudentNotificationsPage() {
  const [loading] = useState(false)
  const [items] = useState<Array<{ id: string; title: string; message: string; createdAt: string; read?: boolean }>>([])

  useEffect(() => {
    // TODO: fetch notifications via API when endpoints are ready
  }, [])

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-gray-500">No notifications yet.</p>
              ) : (
                items.map(n => (
                  <div key={n.id} className={`p-3 rounded-lg border ${n.read ? 'bg-white' : 'bg-primary-50 border-primary-100'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{n.title}</h3>
                      <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}


