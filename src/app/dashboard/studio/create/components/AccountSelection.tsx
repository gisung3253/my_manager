'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePostCreation } from '../context/PostCreationContext'

export default function AccountSelection() {
  const { 
    postType,
    connectedAccounts, 
    setConnectedAccounts,
    selectedAccounts,
    handleAccountToggle,
    loading, 
    setLoading 
  } = usePostCreation()
  
  const router = useRouter()

  // 초기 데이터 로드
  useEffect(() => {
    fetchConnectedAccounts()
  }, [])

  /**
   * 연결된 계정 목록 가져오기
   */
  const fetchConnectedAccounts = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const response = await fetch('/api/connections', {
        headers: { 'x-user-id': user.id.toString() }
      })
      
      const data = await response.json()
      let accounts = data.accounts || []
      
      // 포스트 타입에 따라 계정 필터링
      if (postType === 'video') {
        accounts = accounts.filter((account: any) => 
          ['youtube', 'tiktok', 'instagram', 'facebook', 'linkedin', 'twitter'].includes(account.platform.toLowerCase())
        )
      } else if (postType === 'image') {
        accounts = accounts.filter((account: any) => 
          ['instagram', 'facebook', 'linkedin', 'twitter'].includes(account.platform.toLowerCase())
        )
      } else if (postType === 'text') {
        accounts = accounts.filter((account: any) => 
          ['twitter', 'linkedin', 'facebook'].includes(account.platform.toLowerCase())
        )
      }
      
      setConnectedAccounts(accounts)
    } catch (error) {
      console.error('계정 목록 불러오기 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 플랫폼별 아이콘 매핑
  const platformIcons: Record<string, string> = {
    youtube: '📺',
    instagram: '📷',
    facebook: '👍',
    tiktok: '🎵',
    linkedin: '💼',
    twitter: '🐦'
  }

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">계정 선택</h3>
      
      {connectedAccounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {postType} 포스트를 지원하는 연결된 계정이 없습니다.{' '}
            <button 
              onClick={() => router.push('/dashboard/connections')}
              className="text-yellow-600 underline hover:text-yellow-800"
            >
              계정을 연결하세요
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connectedAccounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleAccountToggle(account.id)}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAccounts.includes(account.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-lg">
                {account.profile_image_url ? (
                  <img 
                    src={account.profile_image_url} 
                    alt={account.account_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  platformIcons[account.platform.toLowerCase()] || '📱'
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{account.account_name}</div>
                <div className="text-sm text-gray-500 capitalize">{account.platform}</div>
              </div>
              {/* 체크박스 */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedAccounts.includes(account.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedAccounts.includes(account.id) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}