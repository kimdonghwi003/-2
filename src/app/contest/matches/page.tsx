'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STATIC_CONTESTS } from '@/data/contests'
import MannerBadge from '@/components/MannerBadge'

type TeamRow = {
  id: string
  contest_id: number
  team_name: string
  description: string | null
  max_size: number
  current_count: number
  required_roles: string[]
  status: string
  leader_nickname: string
  leader_manner_score: number
}

export default function ContestMatchesPage() {
  const supabase = createClient()
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
    const channel = supabase
      .channel('contest-teams-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contest_teams' }, () => fetchTeams())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchTeams() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('v_contest_team_list')
      .select('*')
      .eq('status', '모집중')
      .order('created_at', { ascending: false })
    setTeams((data as TeamRow[]) ?? [])
    setLoading(false)
  }

  function getContestName(contestId: number) {
    return STATIC_CONTESTS.find((c) => c.id === contestId)?.title ?? String(contestId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#800020]">공모전 팀원 모집</h1>
        <Link href="/contest/write" className="px-4 py-2 bg-[#800020] text-white rounded-lg text-sm font-semibold hover:bg-[#5c1a24] transition-colors">
          + 팀 만들기
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-4">팀원 모집 게시글이 없습니다.</p>
          <Link href="/contest/write" className="text-[#800020] font-medium hover:underline">팀을 만들어보세요!</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl border border-[#f4aaba] p-5 hover:shadow-md hover:border-[#800020] transition-all">
              <div className="mb-3">
                <span className="px-2 py-0.5 bg-[#fdf2f4] text-[#800020] text-xs font-semibold rounded-full line-clamp-1">
                  {getContestName(team.contest_id)}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{team.team_name}</h3>
              {team.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{team.description}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {(team.required_roles ?? []).slice(0, 4).map((role) => (
                  <span key={role} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{role}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  👥 {team.current_count}/{team.max_size}명
                </div>
                <MannerBadge score={team.leader_manner_score ?? 36.5} />
              </div>
              <div className="mb-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#800020] rounded-full"
                  style={{ width: `${Math.min(100, (team.current_count / team.max_size) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">리더: {team.leader_nickname}</span>
                <Link
                  href={`/contest/matches/${team.id}`}
                  className="px-3 py-1.5 bg-[#800020] text-white text-sm rounded-lg hover:bg-[#5c1a24] transition-colors"
                >
                  참여하기
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
