'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/match', label: '스포츠 매칭' },
  { href: '/contest', label: '공모전' },
  { href: '/contest/matches', label: '팀원 모집' },
  { href: '/messages', label: '메시지' },
  { href: '/notifications', label: '알림' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-[#800020] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/match" className="text-xl font-bold tracking-tight text-white hover:text-[#c9a84c] transition-colors">
          충북match
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-[#5c1a24] text-white'
                  : 'text-white/80 hover:bg-[#5c1a24] hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/profile"
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              pathname.startsWith('/profile')
                ? 'bg-[#5c1a24] text-white'
                : 'text-white/80 hover:bg-[#5c1a24] hover:text-white'
            }`}
          >
            프로필
          </Link>
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1.5 rounded text-sm font-medium bg-[#c9a84c] text-white hover:bg-[#a8893e] transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  )
}
