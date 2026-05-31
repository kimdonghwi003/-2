import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: match } = await supabase.from('matches').select('author_id, status').eq('id', id).single()
  if (!match) return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
  if (match.status !== '모집중') return NextResponse.json({ error: '모집이 마감된 매치입니다.' }, { status: 400 })
  if (match.author_id === user.id) return NextResponse.json({ error: '본인의 매치에는 신청할 수 없습니다.' }, { status: 400 })

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
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const admin = createAdminClient()
  await admin.from('notifications').insert({
    user_id: match.author_id,
    type: 'match_apply',
    message: '회원이 매치에 신청했습니다.',
    related_id: id,
  })

  return NextResponse.json(data, { status: 201 })
}
