'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ConnectAccountsPage() {
  const router = useRouter()
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([])

  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram' },
    { id: 'twitter', name: 'Twitter/X' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'youtube', name: 'YouTube' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'naver', name: '네이버 블로그' },
    { id: 'kakao', name: '카카오 스토리' },
  ]

  const handleConnect = (platformId: string) => {
    if (connectedAccounts.includes(platformId)) {
      setConnectedAccounts(connectedAccounts.filter(id => id !== platformId))
    } else {
      setConnectedAccounts([...connectedAccounts, platformId])
    }
  }

  const handleNext = () => {
    router.push('/onboarding/pricing')
  }

  const handleSkip = () => {
    router.push('/onboarding/pricing')
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
      <div className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            소셜미디어 계정을 연결하세요
          </h1>
          <p className="text-gray-600">
            연결하면 한 번에 모든 플랫폼에 포스팅할 수 있어요
          </p>
        </div>

        {connectedAccounts.length > 0 && (
          <div className="mb-8 p-6 bg-gray-50 rounded-sm">
            <h3 className="text-lg font-medium mb-4 text-black">
              연결된 계정 ({connectedAccounts.length}개)
            </h3>
            <div className="space-y-2">
              {connectedAccounts.map(accountId => {
                const platform = socialPlatforms.find(p => p.id === accountId)
                return (
                  <div key={accountId} className="flex items-center justify-between p-3 bg-white rounded-sm border border-gray-200">
                    <span className="font-medium text-black">{platform?.name}</span>
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 소셜 플랫폼 그리드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {socialPlatforms.map((platform) => (
            <div key={platform.id} className="border border-gray-300 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-black">{platform.name}</span>
              </div>
              
              <button
                onClick={() => handleConnect(platform.id)}
                className={`w-full py-2 px-4 rounded-sm font-medium transition-colors ${
                  connectedAccounts.includes(platform.id)
                    ? 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {connectedAccounts.includes(platform.id) ? '연결 해제' : '연결'}
              </button>
            </div>
          ))}
        </div>

        {/* 하단 버튼들 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-black font-medium transition-colors"
          >
            나중에 설정하기
          </button>
          
          <button
            onClick={handleNext}
            className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}