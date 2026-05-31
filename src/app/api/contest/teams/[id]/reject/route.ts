import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { application_id } = await request.json()

  const { data: team } = await supabase.from('contest_teams').select('leader_id').eq('id', id).single()
  if (!team || team.leader_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { data: app } = await supabase.from('contest_team_applications').select('applicant_id').eq('id', application_id).single()
  if (!app) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })

  const { error } = await supabase
    .from('contest_team_applications')
    .update({ status: 'rejected' })
    .eq('id', application_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const admin = createAdminClient()
  await admin.from('notifications').insert({
    user_id: app.applicant_id,
    type: 'contest_reject',
    message: '팀 참여 신청이 거절되었습니다.',
    related_id: id,
  })

  return NextResponse.json({ success: true })
}
