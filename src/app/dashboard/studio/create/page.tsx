'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ConnectedAccount {
  id: number
  platform: string
  account_name: string
  profile_image_url?: string
}

function CreatePostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postType = searchParams.get('type') as 'text' | 'image' | 'video'
  
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [mainCaption, setMainCaption] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null) // 이미지/비디오 공통
  const [youtubeTitle, setYoutubeTitle] = useState('')
  const [youtubeDescription, setYoutubeDescription] = useState('')
  const [youtubePrivacy, setYoutubePrivacy] = useState<'public' | 'unlisted' | 'private'>('public')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Twitter specific states
  const [twitterHashtags, setTwitterHashtags] = useState('')
  const [twitterThread, setTwitterThread] = useState<string[]>([''])
  
  // Instagram specific states
  const [instagramAltText, setInstagramAltText] = useState('')
  const [instagramLocation, setInstagramLocation] = useState('')
  
  // Schedule settings
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    fetchConnectedAccounts()
  }, [])

  const fetchConnectedAccounts = async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const response = await fetch('/api/connections', {
        headers: {
          'x-user-id': user.id.toString()
        }
      })
      
      const data = await response.json()
      let accounts = data.accounts || []
      
      // 포스트 타입에 따라 계정 필터링
      if (postType === 'video') {
        accounts = accounts.filter((account: ConnectedAccount) => 
          ['youtube', 'tiktok', 'instagram', 'facebook', 'linkedin', 'twitter'].includes(account.platform.toLowerCase())
        )
      } else if (postType === 'image') {
        accounts = accounts.filter((account: ConnectedAccount) => 
          ['instagram', 'facebook', 'linkedin', 'twitter'].includes(account.platform.toLowerCase())
        )
      } else if (postType === 'text') {
        accounts = accounts.filter((account: ConnectedAccount) => 
          ['twitter', 'linkedin', 'facebook'].includes(account.platform.toLowerCase())
        )
      }
      
      setConnectedAccounts(accounts)
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccountToggle = (accountId: number) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMediaFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      setMediaFile(file)
    }
  }

  // 글자수 계산 (Twitter용)
  const getCharacterCount = () => {
    return mainCaption.length + (twitterHashtags ? twitterHashtags.split(' ').filter(tag => tag.startsWith('#')).join(' ').length : 0)
  }

  // 플랫폼별 선택된 계정 확인
  const getSelectedPlatforms = () => {
    return selectedAccounts.map(id => {
      const account = connectedAccounts.find(acc => acc.id === id)
      return account?.platform.toLowerCase()
    }).filter(Boolean)
  }

  const hasTwitterAccount = () => getSelectedPlatforms().includes('twitter')
  const hasYouTubeAccount = () => getSelectedPlatforms().includes('youtube')
  const hasInstagramAccount = () => getSelectedPlatforms().includes('instagram')

  const handleSubmit = async () => {
    // 텍스트 포스트는 파일이 필요없음
    if (postType !== 'text' && !mediaFile) {
      alert(`${postType === 'image' ? '이미지' : '영상'} 파일을 선택해주세요.`)
      return
    }

    if (selectedAccounts.length === 0) {
      alert('최소 하나의 계정을 선택해주세요.')
      return
    }

    if (!mainCaption.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    // YouTube 계정이 선택된 경우 제목 필수
    const hasYouTubeAccount = selectedAccounts.some(id => 
      connectedAccounts.find(account => account.id === id)?.platform.toLowerCase() === 'youtube'
    )

    if (hasYouTubeAccount && !youtubeTitle.trim()) {
      alert('YouTube 업로드를 위해 제목을 입력해주세요.')
      return
    }

    // 예약 설정 검증
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      alert('예약 날짜와 시간을 설정해주세요.')
      return
    }

    if (isScheduled) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      if (scheduledDateTime <= new Date()) {
        alert('예약 시간은 현재 시간보다 이후여야 합니다.')
        return
      }
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('로그인이 필요합니다.')
        return
      }
      const user = JSON.parse(userStr)

      // 플랫폼 설정 준비
      const platformSettings: any = {}
      if (hasYouTubeAccount) {
        platformSettings.youtube = {
          title: youtubeTitle,
          description: youtubeDescription,
          privacy: youtubePrivacy
        }
      }

      // 예약 게시물인 경우 DB에 저장하고 종료
      if (isScheduled) {
        const formData = new FormData()
        formData.append('userId', user.id.toString())
        formData.append('title', youtubeTitle || '제목 없음')
        formData.append('content', mainCaption)
        formData.append('postType', postType || 'video')
        formData.append('selectedAccounts', JSON.stringify(selectedAccounts))
        formData.append('isScheduled', 'true')
        // 한국 시간으로 입력된 시간을 UTC로 변환하지 않고 그대로 전송
        // ISO 형식으로 전송하되, 시간대 정보를 포함
        const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00+09:00` // 한국 시간대 명시
        formData.append('scheduledAt', scheduledDateTime)
        formData.append('platformSettings', JSON.stringify(platformSettings))
        if (mediaFile) formData.append('video', mediaFile)

        const response = await fetch('/api/posts', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()
        
        if (result.success) {
          const displayTime = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
          alert(`✅ 게시물이 예약되었습니다!\n예약 시간: ${displayTime}`)
          router.push('/dashboard/scheduled')
        } else {
          alert('❌ 예약 저장에 실패했습니다.')
        }
        return
      }

      // 즉시 업로드인 경우 - 새로운 멀티 업로드 API 사용
      const formData = new FormData()
      if (mediaFile) formData.append('video', mediaFile)
      formData.append('selectedAccounts', JSON.stringify(selectedAccounts))
      formData.append('title', youtubeTitle || mainCaption || '제목 없음')
      formData.append('description', youtubeDescription)
      formData.append('privacy', youtubePrivacy)
      formData.append('userId', user.id.toString())
      formData.append('mainCaption', mainCaption)
      formData.append('postType', postType || 'text')
      
      // Twitter 특화 데이터
      if (hasTwitterAccount()) {
        formData.append('twitterHashtags', twitterHashtags)
        formData.append('twitterThread', JSON.stringify(twitterThread))
      }

      const response = await fetch('/api/upload/multi', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setUploadProgress(100)

      if (result.success) {
        const successCount = result.results.filter((r: any) => r.success).length
        const failCount = result.results.filter((r: any) => !r.success).length

        if (successCount > 0) {
          const successResults = result.results.filter((r: any) => r.success)
          let message = `✅ ${successCount}개 계정에 성공적으로 업로드되었습니다!\n\n`
          successResults.forEach((r: any) => {
            message += `• ${r.platform} (${r.accountName})\n${r.url || ''}\n\n`
          })
          
          if (failCount > 0) {
            message += `❌ ${failCount}개 계정 업로드 실패`
          }
          
          alert(message)
          router.push('/dashboard/posted')
        } else {
          alert('❌ 모든 업로드가 실패했습니다.')
        }
      } else {
        alert('❌ 업로드 중 오류가 발생했습니다.')
      }

    } catch (error) {
      console.error('Upload error:', error)
      alert('❌ 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create {postType} post</h1>
            <p className="text-gray-600">Upload your content and choose where to share it</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <input type="checkbox" className="rounded" />
              <span>Remember</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Schedule post</span>
              <button
                onClick={() => setIsScheduled(!isScheduled)}
                className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${
                  isScheduled ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  isScheduled ? 'translate-x-5' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 왼쪽: 계정 선택 */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose accounts</h3>
            
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
                {connectedAccounts.map((account) => {
                  const platformIcons: Record<string, string> = {
                    youtube: '📺',
                    instagram: '📷',
                    facebook: '👍',
                    tiktok: '🎵',
                    linkedin: '💼',
                    twitter: '🐦'
                  }

                  return (
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
                  )
                })}
              </div>
            )}
          </div>

          {/* 오른쪽: 포스트 타입별 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {postType === 'text' ? (
              // 텍스트 포스트 전용 UI
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">✍️ Text Post</h3>
                    {hasTwitterAccount() && (
                      <div className="text-sm text-gray-600">
                        <span className={`${getCharacterCount() > 280 ? 'text-red-500 font-medium' : 'text-blue-500'}`}>
                          {getCharacterCount()}/280
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <textarea
                      value={mainCaption}
                      onChange={(e) => setMainCaption(e.target.value)}
                      placeholder="What's happening?"
                      className="w-full border-0 resize-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 text-lg"
                      rows={6}
                      style={{ minHeight: '150px' }}
                    />
                    
                    {hasTwitterAccount() && getCharacterCount() > 280 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        ⚠️ Twitter has a 280 character limit. Consider shortening your text.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // 이미지/비디오 포스트 UI
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {postType === 'video' ? '🎥 Video Post' : '📸 Image Post'}
                  </h3>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
                  >
                    <div className="text-green-500 text-6xl mb-4">
                      {postType === 'video' ? '🎬' : '🖼️'}
                    </div>
                    <h4 className="text-xl font-medium text-gray-900 mb-2">Click to upload or drag and drop</h4>
                    <p className="text-gray-500 mb-4">
                      {postType === 'video' 
                        ? 'MP4, MOV, AVI files supported' 
                        : 'JPG, PNG, GIF files supported'
                      }
                    </p>
                    
                    <input
                      type="file"
                      accept={postType === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      📎 Choose File
                    </label>
                    
                    {mediaFile && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✅</span>
                          <span className="text-sm text-green-800 font-medium">{mediaFile.name}</span>
                          <span className="text-xs text-green-600">
                            ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption for media posts */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-900">Caption</label>
                    {hasTwitterAccount() && (
                      <div className="text-sm text-gray-600">
                        <span className={`${getCharacterCount() > 280 ? 'text-red-500 font-medium' : 'text-blue-500'}`}>
                          {getCharacterCount()}/280
                        </span>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={mainCaption}
                    onChange={(e) => setMainCaption(e.target.value)}
                    placeholder="Write a caption for your post..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Twitter 특화 설정 */}
            {hasTwitterAccount() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">🐦 Twitter Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Hashtags</label>
                    <input
                      type="text"
                      value={twitterHashtags}
                      onChange={(e) => setTwitterHashtags(e.target.value)}
                      placeholder="#hashtag1 #hashtag2"
                      className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">Add hashtags separated by spaces</p>
                  </div>
                </div>
              </div>
            )}

            {/* Instagram 특화 설정 */}
            {hasInstagramAccount() && (postType === 'image' || postType === 'video') && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3">📸 Instagram Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Alt Text</label>
                    <textarea
                      value={instagramAltText}
                      onChange={(e) => setInstagramAltText(e.target.value)}
                      placeholder="Describe this image for accessibility..."
                      className="w-full p-2 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Location</label>
                    <input
                      type="text"
                      value={instagramLocation}
                      onChange={(e) => setInstagramLocation(e.target.value)}
                      placeholder="Add location..."
                      className="w-full p-2 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Platform-specific options */}
            {selectedAccounts.some(id => 
              connectedAccounts.find(account => account.id === id)?.platform.toLowerCase() === 'youtube'
            ) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-3">📺 YouTube Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Video Title *</label>
                    <input
                      type="text"
                      value={youtubeTitle}
                      onChange={(e) => setYoutubeTitle(e.target.value)}
                      className="w-full p-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Enter video title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                    <textarea
                      value={youtubeDescription}
                      onChange={(e) => setYoutubeDescription(e.target.value)}
                      className="w-full p-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                      placeholder="Video description..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Privacy Settings</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="privacy"
                          value="public"
                          checked={youtubePrivacy === 'public'}
                          onChange={(e) => setYoutubePrivacy(e.target.value as 'public' | 'unlisted' | 'private')}
                          className="w-4 h-4 text-red-600 border-red-300 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-900">🌍 Public (누구나 시청 가능)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="privacy"
                          value="unlisted"
                          checked={youtubePrivacy === 'unlisted'}
                          onChange={(e) => setYoutubePrivacy(e.target.value as 'public' | 'unlisted' | 'private')}
                          className="w-4 h-4 text-red-600 border-red-300 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-900">🔗 Unlisted (링크 있으면 시청 가능)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="privacy"
                          value="private"
                          checked={youtubePrivacy === 'private'}
                          onChange={(e) => setYoutubePrivacy(e.target.value as 'public' | 'unlisted' | 'private')}
                          className="w-4 h-4 text-red-600 border-red-300 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-900">🔒 Private (본인만 시청 가능)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Settings */}
            {isScheduled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">⏰ Schedule Settings</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} // 오늘 이후만 선택 가능
                      className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                {scheduledDate && scheduledTime && (
                  <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <span>📅</span>
                      <span className="text-sm font-medium">
                        예약 시간: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          weekday: 'long'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-blue-800 font-medium">업로드 중...</span>
                  <span className="text-blue-600 text-sm">{uploadProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800">
                <span>📋</span>
                <span>Platform Captions</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleSubmit}
                  disabled={(postType !== 'text' && !mediaFile) || selectedAccounts.length === 0 || uploading || !mainCaption.trim()}
                  className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>{isScheduled ? '예약 중...' : '업로드 중...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isScheduled ? '⏰' : '✈️'}</span>
                      <span>{isScheduled ? 'Schedule post' : 'Post now'}</span>
                    </>
                  )}
                </button>
                
                <button 
                  disabled={uploading}
                  className="border border-gray-300 hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  📁 Save to Drafts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="h-full p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CreatePostContent />
    </Suspense>
  )
}