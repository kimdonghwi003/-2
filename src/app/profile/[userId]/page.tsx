'use client'

export const dynamic = 'force-dynamic'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MannerBadge from '@/components/MannerBadge'

type UserProfile = {
  id: string
  nickname: string
  avatar_url: string | null
  manner_score: number
  department: string | null
  full_name: string | null
}

type SportProfile = {
  sport: string
  skill_level: string
  position: string | null
  career_years: number
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [sportProfiles, setSportProfiles] = useState<SportProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from('users')
        .select('id, nickname, avatar_url, manner_score, department, full_name')
        .eq('id', userId)
        .single()
      setProfile(p as UserProfile)

      const { data: sp } = await supabase
        .from('sport_profiles')
        .select('sport, skill_level, position, career_years')
        .eq('user_id', userId)
      setSportProfiles((sp ?? []) as SportProfile[])

      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>
  if (!profile) return <div className="text-center py-20 text-gray-400">사용자를 찾을 수 없습니다.</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => history.back()} className="text-gray-400 hover:text-[#800020]">←</button>
        <h1 className="text-2xl font-bold text-[#800020]">프로필</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#800020] flex items-center justify-center text-white text-2xl font-bold">
            {profile.nickname[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.nickname}</h2>
            {profile.department && <p className="text-sm text-gray-500">{profile.department}</p>}
            <div className="mt-1">
              <MannerBadge score={profile.manner_score} />
            </div>
          </div>
        </div>
      </div>

      {sportProfiles.length > 0 && (
        <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
          <h3 className="font-bold text-gray-900 mb-3">스포츠 프로필</h3>
          <div className="space-y-2">
            {sportProfiles.map((sp) => (
              <div key={sp.sport} className="flex items-center gap-3 p-3 bg-[#fdf2f4] rounded-lg text-sm">
                <span className="font-semibold text-[#800020] w-16">{sp.sport}</span>
                <span className="text-gray-700">{sp.skill_level}</span>
                {sp.position && <span className="text-gray-500">· {sp.position}</span>}
                <span className="text-gray-500 ml-auto">{sp.career_years}년 경력</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
