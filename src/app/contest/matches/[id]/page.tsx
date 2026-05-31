'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STATIC_CONTESTS } from '@/data/contests'
import MannerBadge from '@/components/MannerBadge'

type Team = {
  id: string
  contest_id: number
  leader_id: string
  team_name: string
  description: string | null
  max_size: number
  current_count: number
  required_roles: string[]
  status: string
}

type Applicant = {
  id: string
  applicant_id: string
  message: string | null
  status: string
  applicant_nickname: string
  applicant_manner_score: number
}

export default function ContestTeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [team, setTeam] = useState<Team | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [myApp, setMyApp] = useState<Applicant | null>(null)
  const [message, setMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    init()
  }, [id])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    const { data } = await supabase.from('contest_teams').select('*').eq('id', id).single()
    setTeam(data)
    if (data) await fetchApplicants(data.leader_id === user?.id)
    setLoading(false)
  }

  async function fetchApplicants(isLeader: boolean) {
    if (!isLeader) return
    const { data } = await supabase
      .from('contest_team_applications')
      .select(`id, applicant_id, message, status, users!applicant_id(nickname, manner_score)`)
      .eq('team_id', id)
    if (data) {
      const apps = data.map((a: Record<string, unknown>) => {
        const u = a.users as { nickname: string; manner_score: number } | null
        return {
          id: a.id as string,
          applicant_id: a.applicant_id as string,
          message: a.message as string | null,
          status: a.status as string,
          applicant_nickname: u?.nickname ?? '알 수 없음',
          applicant_manner_score: u?.manner_score ?? 36.5,
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
    const res = await fetch(`/api/contest/teams/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || '신청에 실패했습니다.'); setApplying(false); return }
    await fetchApplicants(false)
    setApplying(false)
  }

  async function handleAccept(appId: string) {
    await fetch(`/api/contest/teams/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId }),
    })
    await fetchApplicants(true)
  }

  async function handleReject(appId: string) {
    await fetch(`/api/contest/teams/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId }),
    })
    await fetchApplicants(true)
  }

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>
  if (!team) return <div className="text-center py-20 text-gray-400">팀을 찾을 수 없습니다.</div>

  const contest = STATIC_CONTESTS.find((c) => c.id === team.contest_id)
  const isLeader = currentUser?.id === team.leader_id
  const isRecruiting = team.status === '모집중'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/contest/matches" className="text-gray-400 hover:text-[#800020]">←</Link>
        <h1 className="text-2xl font-bold text-[#800020]">팀 상세</h1>
        {isLeader && (
          <Link
            href={`/contest/matches/${id}/edit`}
            className="ml-auto px-3 py-1.5 border border-[#800020] text-[#800020] rounded-lg text-sm font-medium hover:bg-[#800020] hover:text-white transition-colors"
          >
            수정
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-6 mb-6">
        {contest && (
          <div className="mb-4 p-3 bg-[#fdf2f4] rounded-lg text-sm text-[#5c1a24]">
            🏆 {contest.title} · 마감: {contest.deadline}
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-3">{team.team_name}</h2>
        {team.description && <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">{team.description}</p>}
        <div className="flex flex-wrap gap-1 mb-4">
          {(team.required_roles ?? []).map((r) => (
            <span key={r} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{r}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">👥 {team.current_count}/{team.max_size}명</span>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${isRecruiting ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isRecruiting ? '모집 중' : '마감'}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#800020] rounded-full" style={{ width: `${Math.min(100, (team.current_count / team.max_size) * 100)}%` }} />
        </div>
      </div>

      {!isLeader && isRecruiting && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">팀 참여 신청</h3>
          {myApp ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              신청 완료 — 상태: {myApp.status === 'pending' ? '검토 중' : myApp.status === 'accepted' ? '수락됨' : '거절됨'}
            </div>
          ) : (
            <>
              {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="자기소개 및 신청 메시지 (선택)"
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm resize-none mb-3"
              />
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50"
              >
                {applying ? '신청 중...' : '참여 신청'}
              </button>
            </>
          )}
        </div>
      )}

      {isLeader && applicants.length > 0 && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h3 className="font-bold text-gray-900 mb-4">신청자 목록 ({applicants.length}명)</h3>
          <div className="space-y-3">
            {applicants.map((app) => (
              <div key={app.id} className="p-3 bg-[#fdf2f4] rounded-lg">
                <div className="flex items-center justify-between mb-1">
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
                {app.message && <p className="text-sm text-gray-600 mt-1">{app.message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
