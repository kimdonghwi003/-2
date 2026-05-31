'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '회원가입에 실패했습니다.')
        return
      }
      router.push('/match')
      router.refresh()
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf7f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-[#800020]">충북match</Link>
          <p className="text-gray-600 mt-2">회원가입</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#f4aaba] p-8">
          <div className="mb-6 p-4 bg-[#fdf2f4] border border-[#f4aaba] rounded-lg text-sm text-[#5c1a24]">
            <strong>안내사항</strong><br />
            • 충북대학교 재학생·휴학생 대상 서비스입니다.<br />
            • 모든 이메일(Gmail, Naver, Kakao 등)로 가입 가능합니다.<br />
            • 닉네임은 서비스 내에서 공개됩니다.
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="이메일 주소"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="6자 이상"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                required
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="2~10자"
                minLength={2}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#800020] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors disabled:opacity-50"
            >
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[#800020] font-medium hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
