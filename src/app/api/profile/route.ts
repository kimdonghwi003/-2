import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json()
  const allowed = ['nickname', 'department', 'student_id', 'bio', 'profile_image']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (update.nickname) {
    const { data: check } = await supabase.rpc('fn_is_nickname_available', { p_nickname: update.nickname })
    const { data: current } = await supabase.from('users').select('nickname').eq('id', user.id).single()
    if (check === false && current?.nickname !== update.nickname) {
      return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 400 })
    }
  }

  const { data, error } = await supabase.from('users').update(update).eq('id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
