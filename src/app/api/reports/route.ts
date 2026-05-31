import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { reported_id, reason, detail } = await request.json()
  if (!reported_id || !reason) return NextResponse.json({ error: '신고 대상과 사유를 입력해주세요.' }, { status: 400 })
  if (reported_id === user.id) return NextResponse.json({ error: '자기 자신을 신고할 수 없습니다.' }, { status: 400 })

  const { data, error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id,
    reason,
    detail: detail ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
