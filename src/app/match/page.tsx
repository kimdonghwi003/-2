'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MannerBadge from '@/components/MannerBadge'

const SPORT_OPTIONS = ['전체', '풋살', '농구', '테니스', 'e스포츠', '배드민턴', '야구', '기타']
const LEVEL_OPTIONS = ['전체', 'beginner', 'intermediate', 'advanced', 'expert']
const LEVEL_KO: Record<string, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
  expert: '전문',
  any: '무관',
}
const TYPE_KO: Record<string, string> = { recruit: '팀원모집', vs: '대결' }

type MatchRow = {
  id: string
  title: string
  sport: string
  match_type: string
  level: string
  location: string
  scheduled_at: string
  max_players: number
  current_players: number
  status: string
  host_nickname: string
  host_manner_score: number
}

export default function MatchListPage() {
  const supabase = createClient()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [sport, setSport] = useState('전체')
  const [level, setLevel] = useState('전체')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
    const channel = supabase
      .channel('matches-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatches())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sport, level])

  async function fetchMatches() {
    setLoading(true)
    let query = supabase
      .from('v_match_list')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (sport !== '전체') query = query.eq('sport', sport)
    if (level !== '전체') query = query.eq('level', level)

    const { data } = await query
    setMatches((data as MatchRow[]) ?? [])
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#800020]">스포츠 매칭</h1>
        <Link
          href="/match/write"
          className="px-4 py-2 bg-[#800020] text-white rounded-lg text-sm font-semibold hover:bg-[#5c1a24] transition-colors"
        >
          + 매치 작성
        </Link>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {SPORT_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sport === s
                  ? 'bg-[#800020] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#800020] hover:text-[#800020]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {LEVEL_OPTIONS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                level === l
                  ? 'bg-[#5c1a24] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#5c1a24] hover:text-[#5c1a24]'
              }`}
            >
              {l === '전체' ? '전체 레벨' : LEVEL_KO[l] ?? l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-4">매치 게시글이 없습니다.</p>
          <Link href="/match/write" className="text-[#800020] font-medium hover:underline">
            첫 번째 매치를 작성해보세요!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <Link key={m.id} href={`/match/${m.id}`}>
              <div className="bg-white rounded-xl border border-[#f4aaba] p-5 hover:shadow-md hover:border-[#800020] transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 bg-[#fdf2f4] text-[#800020] text-xs font-semibold rounded-full">
                    {m.sport}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {TYPE_KO[m.match_type] ?? m.match_type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{m.title}</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>📍 {m.location}</div>
                  <div>🗓️ {new Date(m.scheduled_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  <div>👥 {m.current_players}/{m.max_players}명 · {LEVEL_KO[m.level] ?? m.level}</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">{m.host_nickname}</span>
                  <MannerBadge score={m.host_manner_score ?? 36.5} />
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#800020] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (m.current_players / m.max_players) * 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
