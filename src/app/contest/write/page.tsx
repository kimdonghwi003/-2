'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { STATIC_CONTESTS } from '@/data/contests'

function ContestWriteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('contestId') ?? ''

  const [form, setForm] = useState({
    contest_id: preselectedId,
    team_name: '',
    description: '',
    max_members: 4,
    required_skills: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const skills = form.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
    const res = await fetch('/api/contest/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, required_skills: skills }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || '팀 생성에 실패했습니다.'); setLoading(false); return }
    router.push(`/contest/matches/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/contest/matches" className="text-gray-400 hover:text-[#800020]">←</Link>
        <h1 className="text-2xl font-bold text-[#800020]">팀 만들기</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공모전 선택</label>
            <select
              required
              value={form.contest_id}
              onChange={(e) => setForm({ ...form, contest_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm bg-white"
            >
              <option value="">공모전을 선택하세요</option>
              {STATIC_CONTESTS.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">팀 이름</label>
            <input
              required
              value={form.team_name}
              onChange={(e) => setForm({ ...form, team_name: e.target.value })}
              placeholder="팀 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">팀 소개</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="팀에 대한 소개 및 원하는 팀원 유형을 작성해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대 팀원 수</label>
            <input
              type="number"
              min={2}
              max={10}
              value={form.max_members}
              onChange={(e) => setForm({ ...form, max_members: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">필요 스킬 (쉼표로 구분)</label>
            <input
              value={form.required_skills}
              onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
              placeholder="예: 디자인, 개발, 기획"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
            />
          </div>
          <div className="flex gap-3">
            <Link href="/contest/matches" className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-center text-sm hover:bg-gray-50 transition-colors">취소</Link>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50 text-sm">
              {loading ? '생성 중...' : '팀 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ContestWritePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">불러오는 중...</div>}>
      <ContestWriteForm />
    </Suspense>
  )
}
