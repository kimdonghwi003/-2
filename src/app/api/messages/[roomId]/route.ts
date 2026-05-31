import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: room } = await supabase.from('message_rooms').select('*').eq('id', roomId).single()
  if (!room || (room.participant_1 !== user.id && room.participant_2 !== user.id)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*, users!sender_id(nickname)')
    .eq('room_id', roomId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })

  const { data: room } = await supabase.from('message_rooms').select('*').eq('id', roomId).single()
  if (!room || (room.participant_1 !== user.id && room.participant_2 !== user.id)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { data, error } = await supabase.from('messages').insert({
    room_id: roomId,
    sender_id: user.id,
    content: content.trim(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
