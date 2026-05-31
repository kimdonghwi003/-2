import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { application_id } = await request.json()

  const { data: match } = await supabase.from('matches').select('host_id').eq('id', id).single()
  if (!match || match.host_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { data: app } = await supabase.from('match_applications').select('applicant_id').eq('id', application_id).single()
  if (!app) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })

  const { error } = await supabase
    .from('match_applications')
    .update({ status: 'accepted' })
    .eq('id', application_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('notifications').insert({
    user_id: app.applicant_id,
    type: 'match_accept',
    title: '매치 신청 수락',
    body: '매치 신청이 수락되었습니다.',
    link: `/match/${id}`,
  })

  return NextResponse.json({ success: true })
}
