'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ConnectAccountsPage() {
  const router = useRouter()
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([])

  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: 'bg-blue-500' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
    { id: 'youtube', name: 'YouTube', icon: '🎥', color: 'bg-red-500' },
    { id: 'facebook', name: 'Facebook', icon: '👍', color: 'bg-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { id: 'naver', name: '네이버 블로그', icon: '🟢', color: 'bg-green-500' },
    { id: 'kakao', name: '카카오 스토리', icon: '💬', color: 'bg-yellow-500' },
  ]

  const handleConnect = (platformId: string) => {
    if (connectedAccounts.includes(platformId)) {
      // 연결 해제
      setConnectedAccounts(connectedAccounts.filter(id => id !== platformId))
    } else {
      // 연결 추가
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Social Manager</span>
        </Link>
        
        {/* 진행 단계 */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <div className="w-16 h-1 bg-green-500"></div>
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div className="w-16 h-1 bg-gray-300"></div>
          <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
            3
          </div>
        </div>

        <div className="w-8"></div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            소셜미디어 계정을 연결하세요
          </h1>
          <p className="text-gray-600">
            연결하면 한 번에 모든 플랫폼에 포스팅할 수 있어요
          </p>
        </div>

        {connectedAccounts.length === 0 ? (
          /* 연결된 계정이 없을 때 */
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center mb-8">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              아직 연결된 계정이 없어요
            </h3>
            <p className="text-gray-600">
              아래에서 "연결" 버튼을 눌러 시작하세요
            </p>
          </div>
        ) : (
          /* 연결된 계정 목록 */
          <div className="bg-white rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">연결된 계정 ({connectedAccounts.length}개)</h3>
            <div className="space-y-3">
              {connectedAccounts.map(accountId => {
                const platform = socialPlatforms.find(p => p.id === accountId)
                return (
                  <div key={accountId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{platform?.icon}</div>
                      <div>
                        <div className="font-medium">{platform?.name}</div>
                        <div className="text-sm text-gray-500">@testuser</div>
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 소셜 플랫폼 그리드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {socialPlatforms.map((platform) => (
            <div key={platform.id} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{platform.icon}</div>
                  <span className="font-medium text-gray-900">{platform.name}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleConnect(platform.id)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  connectedAccounts.includes(platform.id)
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-500 text-white hover:bg-green-600'
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
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            나중에 설정하기
          </button>
          
          <button
            onClick={handleNext}
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}