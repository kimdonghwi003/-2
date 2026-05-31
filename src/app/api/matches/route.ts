import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')
  const level = searchParams.get('level')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from('v_match_list').select('*').eq('status', 'open').order('created_at', { ascending: false })
  if (sport) query = query.eq('sport', sport)
  if (level) query = query.eq('level', level)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json()
  const { title, sport, match_type, level, location, scheduled_at, max_players, reserve_slots, description } = body

  if (!title || !sport || !location || !scheduled_at) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
  }

  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase.from('matches').insert({
    host_id: user.id,
    title,
    sport,
    match_type: match_type ?? 'recruit',
    level: level ?? 'any',
    location,
    scheduled_at: new Date(scheduled_at).toISOString(),
    max_players: max_players ?? 6,
    reserve_slots: reserve_slots ?? 2,
    description: description ?? null,
    expires_at,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
