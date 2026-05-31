'use client'

export const dynamic = 'force-dynamic'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SPORTS = ['축구', '풋살', '농구', 'e스포츠'] as const
type Sport = typeof SPORTS[number]

const MATCH_SIZES: Record<Sport, string[]> = {
  '축구':    ['5vs5', '11vs11'],
  '풋살':    ['3vs3', '5vs5'],
  '농구':    ['3vs3', '5vs5'],
  'e스포츠': ['1vs1', '3vs3', '5vs5'],
}

const LEVELS = ['초급', '중급', '고수'] as const

type FormState = {
  team_name: string
  sport: Sport
  match_size: string
  required_level: string
  location: string
  match_datetime: string
  max_players: number
  description: string
}

export default function MatchEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('matches').select('*').eq('id', id).single()
      if (!data) { router.push('/match'); return }
      if (data.author_id !== user.id) { router.push(`/match/${id}`); return }

      setForm({
        team_name: data.team_name ?? '',
        sport: data.sport as Sport,
        match_size: data.match_size ?? '',
        required_level: data.required_level ?? '초급',
        location: data.location ?? '',
        match_datetime: data.match_datetime ? data.match_datetime.slice(0, 16) : '',
        max_players: data.max_players ?? 10,
        description: data.description ?? '',
      })
      setFetching(false)
    }
    load()
  }, [id])

  function handleSportChange(sport: Sport) {
    if (!form) return
    const sizes = MATCH_SIZES[sport]
    setForm({ ...form, sport, match_size: sizes[0] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setError('')
    setLoading(true)
    try {
      const desc = form.description.trim()
      if (desc && desc.length < 10) {
        setError('소개글은 최소 10자 이상 입력해주세요.')
        setLoading(false)
        return
      }
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, description: desc || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '수정에 실패했습니다.'); return }
      router.push(`/match/${id}`)
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>
  if (!form) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/match/${id}`} className="text-gray-400 hover:text-[#800020]">←</Link>
        <h1 className="text-2xl font-bold text-[#800020]">매치 수정</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">팀 이름</label>
            <input
              required
              value={form.team_name}
              onChange={(e) => setForm({ ...form, team_name: e.target.value })}
              placeholder="우리 팀 이름을 입력하세요"
              minLength={2}
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종목</label>
              <select
                value={form.sport}
                onChange={(e) => handleSportChange(e.target.value as Sport)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm bg-white"
              >
                {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">경기 유형</label>
              <select
                value={form.match_size}
                onChange={(e) => setForm({ ...form, match_size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm bg-white"
              >
                {MATCH_SIZES[form.sport].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수준</label>
              <select
                value={form.required_level}
                onChange={(e) => setForm({ ...form, required_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm bg-white"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
              <input
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="경기 장소"
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">경기 일시</label>
            <input
              type="datetime-local"
              required
              value={form.match_datetime}
              onChange={(e) => setForm({ ...form, match_datetime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">모집 인원</label>
            <input
              type="number"
              min={1}
              max={50}
              required
              value={form.max_players}
              onChange={(e) => setForm({ ...form, max_players: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택, 입력 시 최소 10자)</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="매치에 대한 상세 설명을 입력하세요 (최소 10자)"
              minLength={10}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Link
              href={`/match/${id}`}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-center text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
