import { useEffect, useState } from 'react'
import Layout from '../../components/layout/Layout'
import { getAuth } from '../../global/auth'
import { listMyNotifications, markMyNotificationsRead } from '../../global/api'

export default function StudentNotificationsPage() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Array<{ id: string; title: string; message: string; createdAt: string; read?: boolean }>>([])

  useEffect(() => {
    const run = async () => {
      const auth = getAuth()
      if (!auth?.token) return
      try {
        setLoading(true)
        const res = await listMyNotifications(auth.token)
        const mapped = (res.items || []).map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
        }))
        setItems(mapped)
        // Mark all visible notifications as read
        try {
          const ids = mapped.map(m => m.id)
          if (ids.length) await markMyNotificationsRead(auth.token, ids)
        } catch {}
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    run()
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


