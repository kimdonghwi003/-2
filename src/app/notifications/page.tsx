'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Notif = { id: string; type: string; message: string; is_read: boolean; related_id: string | null; created_at: string }

function notifLink(type: string, related_id: string | null): string | null {
  if (!related_id) return null
  if (type === 'match_apply' || type === 'match_accept' || type === 'match_reject' || type === 'match_cancel') return `/match/${related_id}`
  if (type === 'new_message') return `/messages`
  if (type === 'contest_apply' || type === 'contest_accept' || type === 'contest_reject') return `/contest/matches/${related_id}`
  return null
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifs()
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const channel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchNotifs())
        .subscribe()
      return channel
    }
    const cleanup = getUser()
    return () => { cleanup.then((ch) => ch && supabase.removeChannel(ch)) }
  }, [])

  async function fetchNotifs() {
    const res = await fetch('/api/notifications')
    if (res.ok) setNotifs(await res.json())
    setLoading(false)
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' })
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#800020]">알림</h1>
        <button onClick={markAllRead} className="text-sm text-[#800020] hover:underline">모두 읽음</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">알림이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const link = notifLink(n.type, n.related_id)
            return (
              <div
                key={n.id}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${n.is_read ? 'bg-white border-gray-100' : 'bg-[#fdf2f4] border-[#f4aaba]'}`}
                onClick={() => { markRead(n.id); if (link) window.location.href = link }}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#800020] mt-1 flex-shrink-0 ml-2" />}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(n.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
