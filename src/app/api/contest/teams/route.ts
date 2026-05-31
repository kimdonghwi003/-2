import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('v_contest_team_list').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { contest_id, team_name, description, max_size, required_roles } = await request.json()
  if (!contest_id || !team_name) return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })

  const { data, error } = await supabase.from('contest_teams').insert({
    contest_id,
    leader_id: user.id,
    team_name,
    description: description ?? null,
    max_size: max_size ?? 4,
    required_roles: required_roles ?? [],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
