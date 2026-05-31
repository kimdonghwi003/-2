import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { sport, level, location } = await request.json()

  const { data: matches } = await supabase
    .from('v_match_list')
    .select('*')
    .eq('status', 'open')
    .limit(10)

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `사용자 정보: 종목=${sport}, 수준=${level}, 지역=${location}\n\n현재 매치 목록:\n${JSON.stringify(matches, null, 2)}\n\n위 사용자에게 가장 적합한 매치 3개를 추천하고 이유를 한국어로 간략히 설명해주세요.`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ recommendation: text })
}
