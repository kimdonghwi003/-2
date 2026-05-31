'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { STATIC_CONTESTS, CONTEST_CATEGORIES, CONTEST_REGIONS } from '@/data/contests'
import Link from 'next/link'

export default function ContestPage() {
  const [category, setCategory] = useState('전체')
  const [region, setRegion] = useState('전체')
  const [search, setSearch] = useState('')

  const filtered = STATIC_CONTESTS.filter((c) => {
    const matchCat = category === '전체' || c.category === category
    const matchReg = region === '전체' || c.region === region
    const matchSearch = !search || c.title.includes(search) || c.organizer.includes(search)
    return matchCat && matchReg && matchSearch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#800020]">공모전 목록</h1>
        <Link href="/contest/matches" className="px-4 py-2 bg-[#800020] text-white rounded-lg text-sm font-semibold hover:bg-[#5c1a24] transition-colors">
          팀원 모집 보기
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-4 mb-6 space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="공모전 제목, 주최기관 검색"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {CONTEST_REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${region === r ? 'bg-[#800020] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#fdf2f4]'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CONTEST_CATEGORIES.slice(0, 8).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${category === c ? 'bg-[#5c1a24] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#fdf2f4]'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((contest) => {
          const deadline = new Date(contest.deadline)
          const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 86400))
          return (
            <div key={contest.id} className="bg-white rounded-xl border border-[#f4aaba] p-5 hover:shadow-md hover:border-[#800020] transition-all">
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-0.5 bg-[#fdf2f4] text-[#800020] text-xs font-semibold rounded-full">{contest.category}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{contest.region}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{contest.title}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{contest.description}</p>
              <div className="text-sm space-y-1">
                <div className="text-gray-600">🏛️ {contest.organizer}</div>
                <div className="text-gray-600">🏆 {contest.prize}</div>
                <div className={daysLeft <= 7 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                  📅 마감: {contest.deadline} ({daysLeft > 0 ? `D-${daysLeft}` : '마감'})
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={contest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${contest.organizer} 공모전 페이지`}
                  className="flex-1 py-2 text-center text-sm border border-[#800020] text-[#800020] rounded-lg hover:bg-[#800020] hover:text-white transition-colors"
                >
                  공모전 보기 ↗
                </a>
                <Link
                  href={`/contest/write?contestId=${contest.id}`}
                  className="flex-1 py-2 text-center text-sm bg-[#800020] text-white rounded-lg hover:bg-[#5c1a24] transition-colors"
                >
                  팀 만들기
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">검색 결과가 없습니다.</div>
      )}
    </div>
  )
}
