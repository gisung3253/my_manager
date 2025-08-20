'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PricingPage() {
  const router = useRouter()

  const handleStartTrial = () => {
    alert('스타터 플랜이 선택되었습니다. 로그인해서 시작해보세요!')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="px-6 py-6 flex items-center justify-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          <span className="text-xl font-bold text-black">Social Manager</span>
        </Link>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="bg-black text-white min-h-screen">
        <div className="px-6 py-32 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">
            월 9,900원으로<br />
            모든 기능을 이용하세요
          </h2>
          
          <p className="text-xl text-gray-300 mb-12">
            해외 도구 대비 70% 저렴한 가격<br />
            7일 무료 체험 + 언제든 해지 가능
          </p>
          
          <div className="bg-white text-black p-8 rounded-sm max-w-md mx-auto">
            <div className="text-3xl font-bold mb-4">스타터 플랜</div>
            <div className="text-lg text-gray-600 mb-6">월 9,900원</div>
            
            <ul className="space-y-3 text-left mb-8">
              <li className="flex items-center space-x-3">
                <span className="text-black">✓</span>
                <span>5개 소셜계정 연결</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-black">✓</span>
                <span>무제한 포스팅</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-black">✓</span>
                <span>예약 포스팅</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="text-black">✓</span>
                <span>한국어 고객지원</span>
              </li>
            </ul>
            
            <button
              onClick={handleStartTrial}
              className="block w-full bg-black text-white py-3 text-center hover:bg-gray-800 transition-colors rounded-sm"
            >
              7일 무료 체험 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}