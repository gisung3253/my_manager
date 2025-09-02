'use client'

import { useEffect, useState } from 'react'

/**
 * 연결된 소셜 미디어 계정을 나타내는 인터페이스
 */
interface ConnectedAccount {
  id: number
  platform: string
  account_name: string
  profile_image_url?: string
}

/**
 * 지원하는 소셜 미디어 플랫폼 정보를 나타내는 인터페이스
 */
interface Platform {
  name: string
  icon: string
  color: string
}

export default function ConnectionsPage() {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * 지원하는 소셜 미디어 플랫폼 목록 정의
   */
  const platforms: Platform[] = [
    { name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { name: 'YouTube', icon: '📺', color: 'bg-red-500' },
    { name: 'Twitter', icon: '🐦', color: 'bg-blue-500' },
    { name: 'TikTok', icon: '🎵', color: 'bg-black' },
    { name: 'Facebook', icon: '👍', color: 'bg-blue-600' },
  ]

  useEffect(() => {
    fetchConnectedAccounts()
    handleConnectionCallback()
  }, [])

  /**
   * URL 파라미터를 통해 소셜 미디어 계정 연결 결과 처리
   */
  const handleConnectionCallback = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    // 성공 메시지 처리
    if (success === 'youtube_connected') {
      alert('YouTube 채널이 성공적으로 연결되었습니다!')
      setTimeout(() => fetchConnectedAccounts(), 1000)
      clearUrlParams()
    } else if (success === 'twitter_connected') {
      alert('Twitter 계정이 성공적으로 연결되었습니다!')
      setTimeout(() => fetchConnectedAccounts(), 1000)
      clearUrlParams()
    } else if (success === 'instagram_connected') {
      alert('Instagram 계정이 성공적으로 연결되었습니다!')
      setTimeout(() => fetchConnectedAccounts(), 1000)
      clearUrlParams()
    }

    // 오류 메시지 처리
    if (error) {
      alert('연결 중 오류가 발생했습니다: ' + error)
      clearUrlParams()
    }
  }

  /**
   * URL에서 파라미터 제거
   */
  const clearUrlParams = () => {
    window.history.replaceState({}, '', '/dashboard/connections')
  }

  /**
   * 연결된 소셜 미디어 계정 목록을 가져옴
   */
  const fetchConnectedAccounts = async () => {
    try {
      const user = getUserFromLocalStorage()
      if (!user) return

      const response = await fetch('/api/connections', {
        headers: {
          'x-user-id': user.id.toString()
        }
      })
      
      const data = await response.json()
      setConnectedAccounts(data.accounts || [])
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 소셜 미디어 계정 연결 시작
   * @param platformName 연결할 플랫폼 이름
   */
  const handleConnect = async (platformName: string) => {
    const user = getUserFromLocalStorage()
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    switch (platformName) {
      case 'YouTube':
        // YouTube 연결: API 엔드포인트로 리다이렉트
        window.location.href = `/api/connection/youtube?user_id=${user.id}`
        break;
      
      case 'Twitter':
        // Twitter 연결: 인증 URL 요청 후 리다이렉트
        try {
          const response = await fetch('/api/connection/twitter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          })

          const data = await response.json()
          if (data.authUrl) {
            window.location.href = data.authUrl
          } else {
            alert('Twitter 연결 중 오류가 발생했습니다.')
          }
        } catch (error) {
          console.error('Twitter connection error:', error)
          alert('Twitter 연결 중 오류가 발생했습니다.')
        }
        break;
      
      case 'Instagram':
        // Instagram 연결: 인증 URL 요청 후 리다이렉트
        try {
          const response = await fetch('/api/connection/instagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          })

          const data = await response.json()
          if (data.authUrl) {
            window.location.href = data.authUrl
          } else {
            alert('Instagram 연결 중 오류가 발생했습니다.')
          }
        } catch (error) {
          console.error('Instagram connection error:', error)
          alert('Instagram 연결 중 오류가 발생했습니다.')
        }
        break;
      
      default:
        // 기타 플랫폼: 준비 중 메시지 표시
        alert(`${platformName} 연결 기능은 준비 중입니다.`)
        break;
    }
  }

  /**
   * 연결된 소셜 미디어 계정 연결 해제
   * @param accountId 연결 해제할 계정 ID
   */
  const handleDisconnect = async (accountId: number) => {
    if (!confirm('정말로 이 계정을 연결 해제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/connections/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })

      if (response.ok) {
        await fetchConnectedAccounts()
        alert('계정이 성공적으로 연결 해제되었습니다.')
      } else {
        alert('연결 해제 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  /**
   * localStorage에서 사용자 정보를 가져옴
   * @returns 사용자 객체 또는 null
   */
  const getUserFromLocalStorage = () => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      console.error('User not logged in')
      return null
    }
    return JSON.parse(userStr)
  }

  /**
   * 특정 플랫폼에 대한 연결된 계정 목록 반환
   * @param platformName 플랫폼 이름
   * @returns 해당 플랫폼의 연결된 계정 목록
   */
  const getConnectedAccounts = (platformName: string) => {
    return connectedAccounts.filter(account => 
      account.platform.toLowerCase() === platformName.toLowerCase()
    )
  }

  /**
   * 로딩 중 UI 렌더링
   */
  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Connected Accounts</h1>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * 메인 UI 렌더링
   */
  return (
    <div className="h-full p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>all accounts</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* 플랫폼 목록 */}
        <div className="space-y-3">
          {platforms.map((platform) => {
            const platformAccounts = getConnectedAccounts(platform.name)
            
            return (
              <div key={platform.name} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                  {/* 플랫폼 아이콘 */}
                  <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg font-semibold flex-shrink-0`}>
                    {platform.icon}
                  </div>

                  {/* 연결 버튼 */}
                  <button 
                    onClick={() => handleConnect(platform.name)}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors w-[180px] text-center"
                  >
                    Connect {platform.name}
                  </button>

                  {/* 연결된 계정 목록 */}
                  <div className="flex items-center space-x-2 flex-wrap">
                    {platformAccounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-2 transition-colors group">
                        {/* 프로필 이미지 또는 이니셜 */}
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                          {account.profile_image_url ? (
                            <img 
                              src={account.profile_image_url} 
                              alt={account.account_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            account.account_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        
                        {/* 계정 이름 */}
                        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                          {account.account_name}
                        </span>
                        
                        {/* 연결 해제 버튼 */}
                        <button 
                          onClick={() => handleDisconnect(account.id)}
                          className="w-5 h-5 rounded-full bg-gray-300 hover:bg-red-500 text-gray-600 hover:text-white transition-all duration-200 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100"
                          title="연결 해제"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 계정 새로고침 버튼 */}
        {connectedAccounts.length > 0 && (
          <div className="mt-6">
            <button 
              onClick={fetchConnectedAccounts}
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh All Accounts
            </button>
          </div>
        )}
      </div>
    </div>
  )
}