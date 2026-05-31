'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MannerBadge from '@/components/MannerBadge'

type Applicant = {
  id: string
  applicant_id: string
  status: string
  applicant_nickname: string
  applicant_manner_score: number
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [match, setMatch] = useState<Record<string, unknown> | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [myApp, setMyApp] = useState<Applicant | null>(null)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('v_match_list').select('*').eq('id', id).single()
    setMatch(data)
  }

  async function fetchApplicants() {
    const { data } = await supabase
      .from('match_applications')
      .select(`
        id, applicant_id, status,
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
        body: JSON.stringify({}),
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

  async function handleReject(applicationId: string) {
    const res = await fetch(`/api/matches/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    })
    if (res.ok) fetchApplicants()
  }

  async function handleClose() {
    await fetch(`/api/matches/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: '매치확정' }) })
    fetchMatch()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>
  if (!match) return <div className="text-center py-20 text-gray-400">매치를 찾을 수 없습니다.</div>

  const isHost = currentUser?.id === match.author_id
  const isOpen = match.status === '모집중'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/match" className="text-gray-400 hover:text-[#800020]">←</Link>
        <h1 className="text-2xl font-bold text-[#800020]">매치 상세</h1>
        {isHost && (
          <Link
            href={`/match/${id}/edit`}
            className="ml-auto px-3 py-1.5 border border-[#800020] text-[#800020] rounded-lg text-sm font-medium hover:bg-[#800020] hover:text-white transition-colors"
          >
            수정
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-6 mb-6">
        <div className="flex gap-2 mb-3">
          <span className="px-2 py-0.5 bg-[#fdf2f4] text-[#800020] text-sm font-semibold rounded-full">{match.sport as string}</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">{match.match_size as string}</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">{match.required_level as string}</span>
          <span className={`px-2 py-0.5 text-sm rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isOpen ? '모집 중' : match.status === '매치확정' ? '매치확정' : '취소됨'}
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">{match.team_name as string}</h2>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
          <div>📍 {match.location as string}</div>
          <div>🗓️ {new Date(match.match_datetime as string).toLocaleString('ko-KR')}</div>
          <div>👥 {match.display_count as number}/{match.max_players as number}명</div>
          <div>🏠 주최: <span className="font-medium">{match.author_nickname as string}</span></div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <MannerBadge score={(match.author_manner_score as number) ?? 36.5} />
        </div>

        {match.description && (
          <div className="bg-[#fdf2f4] rounded-lg p-4 text-sm text-gray-700 mb-4 whitespace-pre-line">
            {match.description as string}
          </div>
        )}

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#800020] rounded-full"
            style={{ width: `${Math.min(100, ((match.display_count as number) / (match.max_players as number)) * 100)}%` }}
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
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50"
              >
                {applying ? '신청 중...' : '신청하기'}
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
              <div key={app.id} className="p-3 bg-[#fdf2f4] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${app.applicant_id}`}
                      className="font-medium text-sm hover:text-[#800020] hover:underline"
                    >
                      {app.applicant_nickname}
                    </Link>
                    <MannerBadge score={app.applicant_manner_score} />
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAccept(app.id)}
                          className="px-3 py-1 bg-[#800020] text-white rounded text-sm font-medium hover:bg-[#5c1a24] transition-colors"
                        >
                          수락
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="px-3 py-1 border border-gray-400 text-gray-600 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          거절
                        </button>
                      </>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                        {app.status === 'accepted' ? '수락됨' : '거절됨'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
