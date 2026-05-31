import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('external_contests')
    .select('id, title, url, category, organizer, deadline, source, description, thumbnail_url')
    .eq('is_active', true)
    .gte('deadline', today)
    .order('deadline', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
