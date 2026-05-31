import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { contestId, contestTitle, description } = await request.json()
  if (!contestTitle) return NextResponse.json({ error: '공모전 정보가 필요합니다.' }, { status: 400 })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `다음 공모전 정보를 대학생이 이해하기 쉽게 3문장으로 요약해주세요.\n\n공모전명: ${contestTitle}\n설명: ${description ?? '정보 없음'}`,
    }],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ summary, contestId })
}
