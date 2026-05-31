import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:users!reviewer_id(nickname), reviewee:users!reviewee_id(nickname)')
    .or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { match_id, reviewee_id, rating, comment } = await request.json()
  if (!match_id || !rating) return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
  if (rating < 1 || rating > 5) return NextResponse.json({ error: '평점은 1~5 사이여야 합니다.' }, { status: 400 })

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('match_id', match_id)
    .eq('reviewer_id', user.id)
    .single()
  if (existing) return NextResponse.json({ error: '이미 후기를 작성했습니다.' }, { status: 400 })

  const { data: match } = await supabase.from('matches').select('host_id').eq('id', match_id).single()
  const finalRevieweeId = reviewee_id || (match?.host_id !== user.id ? match?.host_id : null)
  if (!finalRevieweeId) return NextResponse.json({ error: '후기 대상을 확인할 수 없습니다.' }, { status: 400 })
  if (finalRevieweeId === user.id) return NextResponse.json({ error: '자신에게 후기를 작성할 수 없습니다.' }, { status: 400 })

  const { data, error } = await supabase.from('reviews').insert({
    match_id,
    reviewer_id: user.id,
    reviewee_id: finalRevieweeId,
    rating,
    comment: comment ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
