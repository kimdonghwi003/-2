import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const facility = searchParams.get('facility')

  if (!date) {
    return NextResponse.json({ error: 'date 파라미터가 필요합니다.' }, { status: 400 })
  }

  const supabase = await createClient()

  let query = supabase
    .from('sports_reservations')
    .select('facility, reservation_date, start_time, end_time, status, last_crawled_at')
    .eq('reservation_date', date)
    .order('facility')
    .order('start_time')

  if (facility && facility !== 'all') {
    query = query.eq('facility', facility)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}
