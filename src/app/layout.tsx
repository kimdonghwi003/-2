import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: '충북match — 교내 매칭 플랫폼',
  description: '충북대학교 스포츠 매칭 & 공모전 팀원 모집 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={geist.variable}>
      <body className="min-h-screen bg-[#fbf7f7] text-[#1a0a0d]">{children}</body>
    </html>
  )
}
