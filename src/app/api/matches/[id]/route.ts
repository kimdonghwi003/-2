import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('v_match_list').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json()
  const { data: match } = await supabase.from('matches').select('host_id').eq('id', id).single()
  if (!match || match.host_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { data, error } = await supabase.from('matches').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: match } = await supabase.from('matches').select('host_id').eq('id', id).single()
  if (!match || match.host_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  await supabase.from('matches').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
