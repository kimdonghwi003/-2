import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type MessageRoom = {
  id: string
  created_at: string
  match_id: string
  user1: { id: string; nickname: string } | null
  user2: { id: string; nickname: string } | null
}

type ContestRoomMember = {
  room_id: string
  contest_chat_rooms: {
    id: string
    team_id: string
    contest_teams: { team_name: string } | null
  } | null
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const supabaseAny = supabase as unknown as { from: (table: string) => unknown }

  const { data: rooms } = await (supabaseAny.from('message_rooms') as {
    select: (q: string) => {
      or: (q: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: MessageRoom[] | null }>
      }
    }
  }).select(`
    id, created_at, match_id,
    user1:users!user1_id(id, nickname),
    user2:users!user2_id(id, nickname)
  `).or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
  .order('created_at', { ascending: false })

  const { data: contestRooms } = await (supabaseAny.from('contest_chat_members') as {
    select: (q: string) => {
      eq: (col: string, val: string) => Promise<{ data: ContestRoomMember[] | null }>
    }
  }).select(`
    room_id,
    contest_chat_rooms!room_id(id, team_id, contest_teams!team_id(team_name))
  `).eq('user_id', user?.id ?? '')

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#800020] mb-6">메시지</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">1:1 매치 채팅</h2>
          {!rooms || rooms.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#f4aaba] p-6 text-center text-gray-400">
              매치 채팅방이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => {
                const other = room.user1?.id === user?.id ? room.user2 : room.user1
                return (
                  <Link key={room.id} href={`/messages/${room.id}`}>
                    <div className="bg-white rounded-xl border border-[#f4aaba] p-4 hover:border-[#800020] hover:shadow-sm transition-all">
                      <div className="font-medium text-gray-900">{other?.nickname ?? '알 수 없음'}</div>
                      <div className="text-sm text-gray-400">매치 채팅</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">공모전 팀 채팅</h2>
          {!contestRooms || contestRooms.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#f4aaba] p-6 text-center text-gray-400">
              참여 중인 팀 채팅방이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {contestRooms.map((cr) => {
                const teamName = cr.contest_chat_rooms?.contest_teams?.team_name ?? '팀 채팅방'
                return (
                  <Link key={cr.room_id} href={`/messages/contest/${cr.room_id}`}>
                    <div className="bg-white rounded-xl border border-[#f4aaba] p-4 hover:border-[#800020] hover:shadow-sm transition-all">
                      <div className="font-medium text-gray-900">{teamName}</div>
                      <div className="text-sm text-gray-400">공모전 팀 채팅</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
