import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: team } = await supabase.from('contest_teams').select('leader_id').eq('id', id).single()
  if (!team || team.leader_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const body = await request.json()

  if ('description' in body) {
    const desc = body.description
    if (!desc || (typeof desc === 'string' && desc.trim() === '')) {
      body.description = null
    } else if (typeof desc === 'string' && desc.trim().length < 10) {
      return NextResponse.json({ error: '소개글은 최소 10자 이상 입력해주세요.' }, { status: 400 })
    } else if (typeof desc === 'string') {
      body.description = desc.trim()
    }
  }

  const { data, error } = await supabase.from('contest_teams').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: team } = await supabase.from('contest_teams').select('leader_id').eq('id', id).single()
  if (!team || team.leader_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  await supabase.from('contest_teams').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
