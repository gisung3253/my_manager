'use client'

import { useEffect, useState } from 'react'

interface ConnectedAccount {
  id: number
  platform: string
  account_name: string
  profile_image_url?: string
}

interface Platform {
  name: string
  icon: string
  color: string
}

export default function ConnectionsPage() {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)

  const platforms: Platform[] = [
    { name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { name: 'YouTube', icon: '📺', color: 'bg-red-500' },
    { name: 'Twitter', icon: '🐦', color: 'bg-blue-500' },
    { name: 'TikTok', icon: '🎵', color: 'bg-black' },
    { name: 'Facebook', icon: '👍', color: 'bg-blue-600' },
    { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { name: 'Bluesky', icon: '🦋', color: 'bg-sky-500' },
    { name: 'Threads', icon: '🧵', color: 'bg-gray-800' },
    { name: 'Pinterest', icon: '📌', color: 'bg-red-600' },
  ]

  useEffect(() => {
    fetchConnectedAccounts()
    
    // Check for connection success/error from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'youtube_connected') {
      alert('YouTube 채널이 성공적으로 연결되었습니다!')
      setTimeout(() => fetchConnectedAccounts(), 1000)
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/dashboard/connections')
    } else if (success === 'twitter_connected') {
      alert('Twitter 계정이 성공적으로 연결되었습니다!')
      setTimeout(() => fetchConnectedAccounts(), 1000)
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/dashboard/connections')
    }

    if (error) {
      alert('연결 중 오류가 발생했습니다: ' + error)
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/dashboard/connections')
    }
  }, [])

  const fetchConnectedAccounts = async () => {
    try {
      // localStorage에서 사용자 정보 가져오기
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        console.error('User not logged in')
        return
      }
      
      const user = JSON.parse(userStr)
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

  const handleConnect = async (platformName: string) => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      alert('로그인이 필요합니다.')
      return
    }
    
    const user = JSON.parse(userStr)

    if (platformName === 'YouTube') {
      window.location.href = `/api/connection/youtube?user_id=${user.id}`
    } else if (platformName === 'Twitter') {
      try {
        const response = await fetch('/api/connection/twitter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
    } else {
      alert(`${platformName} 연결 기능은 준비 중입니다.`)
    }
  }

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('정말로 이 계정을 연결 해제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/connections/disconnect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      })

      if (response.ok) {
        // 성공하면 목록 새로고침
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

  const isConnected = (platformName: string) => {
    return connectedAccounts.some(account => 
      account.platform.toLowerCase() === platformName.toLowerCase()
    )
  }

  const getConnectedAccounts = (platformName: string) => {
    return connectedAccounts.filter(account => 
      account.platform.toLowerCase() === platformName.toLowerCase()
    )
  }

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

  return (
    <div className="h-full p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>all accounts</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-3">
          {platforms.map((platform) => {
            const connectedAccounts = getConnectedAccounts(platform.name)
            
            return (
              <div key={platform.name} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                  {/* 플랫폼 아이콘 */}
                  <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg font-semibold flex-shrink-0`}>
                    {platform.icon}
                  </div>

                  {/* Connect 버튼 - 항상 표시 */}
                  <button 
                    onClick={() => handleConnect(platform.name)}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors w-[180px] text-center"
                  >
                    Connect {platform.name}
                  </button>

                  {/* 연결된 계정들 표시 */}
                  <div className="flex items-center space-x-2 flex-wrap">
                    {connectedAccounts.map((account) => (
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
                        
                        {/* 삭제 버튼 */}
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

        {/* Refresh 버튼 (연결된 계정이 있을 때만) */}
        {connectedAccounts.length > 0 && (
          <div className="mt-6">
            <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Refresh All Accounts
            </button>
          </div>
        )}
      </div>
    </div>
  )
}