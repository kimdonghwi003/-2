import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { message, role } = await request.json()

  const { data: team } = await supabase.from('contest_teams').select('leader_id, status').eq('id', id).single()
  if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다.' }, { status: 404 })
  if (team.status !== 'recruiting') return NextResponse.json({ error: '모집이 마감된 팀입니다.' }, { status: 400 })
  if (team.leader_id === user.id) return NextResponse.json({ error: '본인의 팀에는 신청할 수 없습니다.' }, { status: 400 })

  const { data: existing } = await supabase.from('contest_team_applications').select('id').eq('team_id', id).eq('applicant_id', user.id).single()
  if (existing) return NextResponse.json({ error: '이미 신청한 팀입니다.' }, { status: 400 })

  const { data, error } = await supabase.from('contest_team_applications').insert({
    team_id: id,
    applicant_id: user.id,
    message: message ?? null,
    role: role ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('notifications').insert({
    user_id: team.leader_id,
    type: 'team_apply',
    title: '새 팀원 신청',
    body: '팀에 참여 신청이 들어왔습니다.',
    link: `/contest/matches/${id}`,
  })

  return NextResponse.json(data, { status: 201 })
}
