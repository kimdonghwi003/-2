'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MannerBadge from '@/components/MannerBadge'

const LEVEL_KO: Record<string, string> = {
  beginner: '입문', intermediate: '중급', advanced: '고급', expert: '전문', any: '무관',
}

type Applicant = {
  id: string
  applicant_id: string
  message: string | null
  slot_type: string
  status: string
  applicant_nickname: string
  applicant_manner_score: number
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [match, setMatch] = useState<Record<string, unknown> | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [myApp, setMyApp] = useState<Applicant | null>(null)
  const [message, setMessage] = useState('')
  const [slotType, setSlotType] = useState<'main' | 'reserve'>('main')
  const [applying, setApplying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    init()
    const channel = supabase
      .channel(`match-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_applications', filter: `match_id=eq.${id}` }, () => fetchApplicants())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    await Promise.all([fetchMatch(), fetchApplicants()])
    setLoading(false)
  }

  async function fetchMatch() {
    const { data } = await supabase.from('v_match_list').select('*').eq('id', id).single()
    setMatch(data)
  }

  async function fetchApplicants() {
    const { data } = await supabase
      .from('match_applications')
      .select(`
        id, applicant_id, message, slot_type, status,
        users!applicant_id (nickname, manner_score)
      `)
      .eq('match_id', id)
      .order('created_at')

    if (data) {
      const apps = data.map((a: Record<string, unknown>) => {
        const userInfo = a.users as { nickname: string; manner_score: number } | null
        return {
          id: a.id as string,
          applicant_id: a.applicant_id as string,
          message: a.message as string | null,
          slot_type: a.slot_type as string,
          status: a.status as string,
          applicant_nickname: userInfo?.nickname ?? '알 수 없음',
          applicant_manner_score: userInfo?.manner_score ?? 36.5,
        }
      })
      setApplicants(apps)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyApp(apps.find((a) => a.applicant_id === user.id) ?? null)
    }
  }

  async function handleApply() {
    setApplying(true)
    setError('')
    try {
      const res = await fetch(`/api/matches/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, slot_type: slotType }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '신청에 실패했습니다.'); return }
      fetchApplicants()
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setApplying(false)
    }
  }

  async function handleAccept(applicationId: string) {
    const res = await fetch(`/api/matches/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    })
    if (res.ok) fetchApplicants()
  }

  async function handleClose() {
    await fetch(`/api/matches/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'closed' }) })
    fetchMatch()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>
  if (!match) return <div className="text-center py-20 text-gray-400">매치를 찾을 수 없습니다.</div>

  const isHost = currentUser?.id === match.host_id
  const isOpen = match.status === 'open'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/match" className="text-gray-400 hover:text-[#800020]">←</Link>
        <h1 className="text-2xl font-bold text-[#800020]">매치 상세</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-6 mb-6">
        <div className="flex gap-2 mb-3">
          <span className="px-2 py-0.5 bg-[#fdf2f4] text-[#800020] text-sm font-semibold rounded-full">{match.sport as string}</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">{LEVEL_KO[match.level as string] ?? match.level as string}</span>
          <span className={`px-2 py-0.5 text-sm rounded-full ${match.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {match.status === 'open' ? '모집 중' : '마감'}
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">{match.title as string}</h2>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
          <div>📍 {match.location as string}</div>
          <div>🗓️ {new Date(match.scheduled_at as string).toLocaleString('ko-KR')}</div>
          <div>👥 {match.current_players as number}/{match.max_players as number}명 (예비 {match.reserve_slots as number}명)</div>
          <div>🏠 주최: <span className="font-medium">{match.host_nickname as string}</span></div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <MannerBadge score={(match.host_manner_score as number) ?? 36.5} />
        </div>

        {match.description && (
          <div className="bg-[#fdf2f4] rounded-lg p-4 text-sm text-gray-700 mb-4 whitespace-pre-line">
            {match.description as string}
          </div>
        )}

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#800020] rounded-full"
            style={{ width: `${Math.min(100, ((match.current_players as number) / (match.max_players as number)) * 100)}%` }}
          />
        </div>

        {isHost && isOpen && (
          <button
            onClick={handleClose}
            className="mt-4 px-4 py-2 border border-[#800020] text-[#800020] rounded-lg text-sm font-medium hover:bg-[#800020] hover:text-white transition-colors"
          >
            모집 마감
          </button>
        )}
      </div>

      {!isHost && isOpen && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">신청하기</h3>
          {myApp ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              신청 완료 — 상태: {myApp.status === 'pending' ? '검토 중' : myApp.status === 'accepted' ? '수락됨' : '거절됨'}
            </div>
          ) : (
            <>
              {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setSlotType('main')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${slotType === 'main' ? 'bg-[#800020] text-white' : 'border border-gray-300 text-gray-600'}`}
                >
                  주전
                </button>
                <button
                  onClick={() => setSlotType('reserve')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${slotType === 'reserve' ? 'bg-[#800020] text-white' : 'border border-gray-300 text-gray-600'}`}
                >
                  예비
                </button>
              </div>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="자기소개 또는 신청 메시지 (선택)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm resize-none mb-3"
              />
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50"
              >
                {applying ? '신청 중...' : '신청'}
              </button>
            </>
          )}
        </div>
      )}

      {isHost && applicants.length > 0 && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h3 className="font-bold text-gray-900 mb-4">신청자 목록 ({applicants.length}명)</h3>
          <div className="space-y-3">
            {applicants.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-[#fdf2f4] rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{app.applicant_nickname}</span>
                    <MannerBadge score={app.applicant_manner_score} />
                    <span className="text-xs text-gray-500">({app.slot_type === 'main' ? '주전' : '예비'})</span>
                  </div>
                  {app.message && <p className="text-sm text-gray-600 mt-1">{app.message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'pending' ? (
                    <button
                      onClick={() => handleAccept(app.id)}
                      className="px-3 py-1 bg-[#800020] text-white rounded text-sm font-medium hover:bg-[#5c1a24] transition-colors"
                    >
                      수락
                    </button>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {app.status === 'accepted' ? '수락됨' : '거절됨'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
