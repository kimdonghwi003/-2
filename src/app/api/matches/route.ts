import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const level = searchParams.get('level')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from('v_match_list').select('*').eq('status', '모집중').order('created_at', { ascending: false })
  if (sport) query = query.eq('sport', sport)
  if (level) query = query.eq('required_level', level)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json()
  const { team_name, sport, match_size, required_level, location, match_datetime, max_players, description } = body

  if (!team_name || !sport || !match_size || !required_level || !location || !match_datetime) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await supabase.from('matches').insert({
    author_id: user.id,
    team_name,
    sport,
    match_size,
    required_level,
    location,
    match_datetime: new Date(match_datetime).toISOString(),
    max_players: max_players ?? 10,
    description: description || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
