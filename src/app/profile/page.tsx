'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import MannerBadge from '@/components/MannerBadge'

const TABS = ['기본정보', '스포츠프로필', '공모전프로필', '내 매치', '내 팀', '후기', '신고']

type UserProfile = {
  id: string
  email: string
  nickname: string
  profile_image: string | null
  manner_score: number
  department: string | null
  student_id: string | null
  bio: string | null
}

type SportProfile = {
  sport: string
  level: string
  position: string | null
  career: string | null
  available_days: string[]
  available_times: string[]
}

export default function ProfilePage() {
  const supabase = createClient()
  const [tab, setTab] = useState(0)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [sportProfile, setSportProfile] = useState<SportProfile | null>(null)
  const [myMatches, setMyMatches] = useState<Record<string, unknown>[]>([])
  const [myTeams, setMyTeams] = useState<Record<string, unknown>[]>([])
  const [myReviews, setMyReviews] = useState<Record<string, unknown>[]>([])
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
    setProfile(p as UserProfile)
    setEditForm(p ?? {})

    const { data: sp } = await supabase.from('sport_profiles').select('*').eq('user_id', user.id).single()
    setSportProfile(sp as SportProfile)

    const { data: matches } = await supabase.from('matches').select('id, title, sport, status, created_at').eq('host_id', user.id).order('created_at', { ascending: false })
    setMyMatches(matches ?? [])

    const { data: teams } = await supabase.from('contest_teams').select('id, team_name, status, created_at').eq('leader_id', user.id).order('created_at', { ascending: false })
    setMyTeams(teams ?? [])

    const { data: reviews } = await supabase.from('reviews').select('*, reviewer:users!reviewer_id(nickname)').eq('reviewee_id', user.id).order('created_at', { ascending: false })
    setMyReviews(reviews ?? [])
  }

  async function saveProfile() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    await init()
    setSaving(false)
  }

  if (!profile) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>

  const LEVEL_KO: Record<string, string> = { beginner: '입문', intermediate: '중급', advanced: '고급', expert: '전문' }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#f4aaba] p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#800020] flex items-center justify-center text-white text-2xl font-bold">
            {profile.nickname[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.nickname}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="mt-1">
              <MannerBadge score={profile.manner_score} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 flex-wrap">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-[#800020] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#800020]'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h2 className="font-bold text-gray-900 mb-4">기본 정보 수정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input value={editForm.nickname ?? ''} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
              <input value={editForm.department ?? ''} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                placeholder="예: 컴퓨터공학과"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
              <input value={editForm.student_id ?? ''} onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })}
                placeholder="예: 2024XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">자기소개</label>
              <textarea rows={3} value={editForm.bio ?? ''} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="자기소개를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm resize-none" />
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="w-full py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h2 className="font-bold text-gray-900 mb-4">스포츠 프로필</h2>
          {sportProfile ? (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">종목:</span> {sportProfile.sport}</div>
              <div><span className="font-medium">수준:</span> {LEVEL_KO[sportProfile.level] ?? sportProfile.level}</div>
              {sportProfile.position && <div><span className="font-medium">포지션:</span> {sportProfile.position}</div>}
              {sportProfile.career && <div><span className="font-medium">경력:</span> {sportProfile.career}</div>}
              <div><span className="font-medium">가능 요일:</span> {sportProfile.available_days.join(', ')}</div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">스포츠 프로필이 없습니다.</p>
          )}
        </div>
      )}

      {tab === 2 && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h2 className="font-bold text-gray-900 mb-4">공모전 프로필</h2>
          <p className="text-gray-400 text-sm">공모전 프로필을 작성하면 팀 매칭에 유리합니다.</p>
        </div>
      )}

      {tab === 3 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">내 매치</h2>
          {myMatches.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#f4aaba] p-6 text-center text-gray-400">작성한 매치가 없습니다.</div>
          ) : myMatches.map((m) => (
            <div key={m.id as string} className="bg-white rounded-xl border border-[#f4aaba] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{m.title as string}</p>
                  <p className="text-xs text-gray-500">{m.sport as string}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${m.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {m.status === 'open' ? '모집 중' : '마감'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 4 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">내 팀</h2>
          {myTeams.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#f4aaba] p-6 text-center text-gray-400">리더로 참여 중인 팀이 없습니다.</div>
          ) : myTeams.map((t) => (
            <div key={t.id as string} className="bg-white rounded-xl border border-[#f4aaba] p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{t.team_name as string}</p>
                <span className={`px-2 py-1 text-xs rounded-full ${t.status === 'recruiting' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t.status === 'recruiting' ? '모집 중' : '완성'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900">받은 후기</h2>
          {myReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#f4aaba] p-6 text-center text-gray-400">받은 후기가 없습니다.</div>
          ) : myReviews.map((r) => (
            <div key={r.id as string} className="bg-white rounded-xl border border-[#f4aaba] p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-yellow-400">{'★'.repeat(r.rating as number)}{'☆'.repeat(5 - (r.rating as number))}</span>
                <span className="text-xs text-gray-400">{new Date(r.created_at as string).toLocaleDateString('ko-KR')}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment as string}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h2 className="font-bold text-gray-900 mb-4">신고하기</h2>
          <p className="text-sm text-gray-500 mb-4">부적절한 사용자를 신고할 수 있습니다.</p>
          <ReportForm />
        </div>
      )}
    </div>
  )
}

function ReportForm() {
  const [form, setForm] = useState({ reported_id: '', reason: '', detail: '' })
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) setDone(true)
  }

  if (done) return <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">신고가 접수되었습니다.</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">신고 대상 ID</label>
        <input required value={form.reported_id} onChange={(e) => setForm({ ...form, reported_id: e.target.value })}
          placeholder="사용자 ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">신고 사유</label>
        <select required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm bg-white">
          <option value="">선택하세요</option>
          <option value="spam">스팸/광고</option>
          <option value="abuse">욕설/비방</option>
          <option value="inappropriate">부적절한 컨텐츠</option>
          <option value="no_show">노쇼</option>
          <option value="other">기타</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
        <textarea rows={3} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })}
          placeholder="신고 내용을 자세히 작성해주세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm resize-none" />
      </div>
      <button type="submit" className="w-full py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors text-sm">
        신고하기
      </button>
    </form>
  )
}
