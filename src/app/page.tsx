import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fbf7f7] flex flex-col">
      <nav className="bg-[#800020] text-white px-6 py-4 flex justify-between items-center">
        <span className="text-2xl font-bold text-[#c9a84c]">충북match</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-white hover:text-[#c9a84c] transition-colors">
            로그인
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-[#c9a84c] text-white text-sm rounded hover:bg-[#a8893e] transition-colors">
            회원가입
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold text-[#800020] mb-4">충북match</h1>
          <p className="text-xl text-[#5c1a24] mb-2 font-medium">충북대학교 교내 매칭 플랫폼</p>
          <p className="text-gray-600 mb-10">
            스포츠 매치 상대를 찾거나, 공모전 팀원을 모집하세요.<br />
            매너 온도 기반의 신뢰할 수 있는 교내 커뮤니티.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="px-8 py-3 bg-[#800020] text-white rounded-lg font-semibold hover:bg-[#5c1a24] transition-colors text-lg">
              시작하기
            </Link>
            <Link href="/login" className="px-8 py-3 border-2 border-[#800020] text-[#800020] rounded-lg font-semibold hover:bg-[#800020] hover:text-white transition-colors text-lg">
              로그인
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          {[
            { icon: '⚽', title: '스포츠 매칭', desc: '풋살, 농구, 테니스 등 다양한 종목의 경기 상대를 찾아보세요.' },
            { icon: '🏆', title: '공모전 팀원 모집', desc: '충청권 17개 공모전에서 나에게 맞는 팀을 구성하세요.' },
            { icon: '🌡️', title: '매너 온도', desc: '매너 평가 시스템으로 신뢰할 수 있는 상대와 매칭됩니다.' },
          ].map((feat) => (
            <div key={feat.title} className="bg-white rounded-xl p-6 shadow-sm border border-[#f4aaba]">
              <div className="text-4xl mb-3">{feat.icon}</div>
              <h3 className="text-lg font-bold text-[#800020] mb-2">{feat.title}</h3>
              <p className="text-gray-600 text-sm">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
