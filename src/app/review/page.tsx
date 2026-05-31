'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

type Review = {
  id: string
  match_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: { nickname: string }
  reviewee?: { nickname: string }
}

type AcceptedMatch = {
  id: string
  match_id: string
  match?: { title: string }
  applicant_id: string
}

import { createClient } from '@/lib/supabase/client'

export default function ReviewPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [pendingMatches, setPendingMatches] = useState<AcceptedMatch[]>([])
  const [myId, setMyId] = useState('')
  const [form, setForm] = useState({ match_id: '', reviewee_id: '', rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'write' | 'history'>('write')

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyId(user.id)

    const { data: accepted } = await supabase
      .from('match_applications')
      .select('id, match_id, applicant_id, matches!match_id(title)')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    const myAccepted = (accepted ?? []).filter((a: Record<string, unknown>) => {
      const match = a.matches as { title: string } | null
      return match !== null
    })
    setPendingMatches(myAccepted as AcceptedMatch[])

    const { data: revData } = await supabase
      .from('reviews')
      .select(`*, reviewer:users!reviewer_id(nickname), reviewee:users!reviewee_id(nickname)`)
      .or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
    setReviews((revData ?? []) as Review[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ match_id: '', reviewee_id: '', rating: 5, comment: '' })
      init()
    }
    setSubmitting(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#800020] mb-6">매너 후기</h1>

      <div className="flex gap-2 mb-6">
        {(['write', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-[#800020] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#800020]'}`}>
            {t === 'write' ? '후기 작성' : '후기 목록'}
          </button>
        ))}
      </div>

      {tab === 'write' && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h2 className="font-bold text-gray-900 mb-4">후기 작성</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">매치 선택</label>
              <select required value={form.match_id}
                onChange={(e) => { const match = pendingMatches.find((m) => m.match_id === e.target.value); setForm({ ...form, match_id: e.target.value, reviewee_id: match ? (match.applicant_id === myId ? '' : match.applicant_id) : '' }) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm bg-white">
                <option value="">매치를 선택하세요</option>
                {pendingMatches.map((m) => (
                  <option key={m.id} value={m.match_id}>{(m.match as { title: string } | null)?.title ?? m.match_id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">평점</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })}
                    className={`w-10 h-10 rounded-full text-lg ${form.rating >= r ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">코멘트</label>
              <textarea rows={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="상대방의 매너에 대해 자유롭게 작성해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50">
              {submitting ? '제출 중...' : '후기 제출'}
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">작성한 후기가 없습니다.</div>
          ) : reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-[#f4aaba] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{r.reviewer_id === myId ? '내가 작성' : `${(r.reviewer as { nickname: string } | null)?.nickname ?? '?'} 작성`}</span>
                  <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
