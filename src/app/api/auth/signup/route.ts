import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { email, password, nickname } = await request.json()

  if (!email || !password || !nickname) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }
  if (nickname.length < 2 || nickname.length > 10) {
    return NextResponse.json({ error: '닉네임은 2~10자여야 합니다.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: nicknameCheck } = await admin
    .rpc('fn_is_nickname_available', { p_nickname: nickname })

  if (nicknameCheck === false) {
    return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 400 })
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nickname },
  })

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 400 })
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const supabase = await createClient()
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

  if (loginError) {
    return NextResponse.json({ error: '계정 생성 후 로그인에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ user: authData.user }, { status: 201 })
}
