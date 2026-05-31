import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { message, slot_type } = await request.json()

  const { data: match } = await supabase.from('matches').select('host_id, status').eq('id', id).single()
  if (!match) return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
  if (match.status !== 'open') return NextResponse.json({ error: '모집이 마감된 매치입니다.' }, { status: 400 })
  if (match.host_id === user.id) return NextResponse.json({ error: '본인의 매치에는 신청할 수 없습니다.' }, { status: 400 })

  const { data: existing } = await supabase
    .from('match_applications')
    .select('id')
    .eq('match_id', id)
    .eq('applicant_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: '이미 신청한 매치입니다.' }, { status: 400 })

  const { data, error } = await supabase.from('match_applications').insert({
    match_id: id,
    applicant_id: user.id,
    message: message ?? null,
    slot_type: slot_type ?? 'main',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('notifications').insert({
    user_id: match.host_id,
    type: 'match_apply',
    title: '새 매치 신청',
    body: '회원이 매치에 신청했습니다.',
    link: `/match/${id}`,
  })

  return NextResponse.json(data, { status: 201 })
}
