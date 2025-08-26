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
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [youtubeTitle, setYoutubeTitle] = useState('')
  const [youtubeDescription, setYoutubeDescription] = useState('')
  const [youtubePrivacy, setYoutubePrivacy] = useState<'public' | 'unlisted' | 'private'>('public')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
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
      setVideoFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      setVideoFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!videoFile || selectedAccounts.length === 0) {
      alert('영상 파일과 최소 하나의 계정을 선택해주세요.')
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
        formData.append('video', videoFile)

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
      formData.append('video', videoFile)
      formData.append('selectedAccounts', JSON.stringify(selectedAccounts))
      formData.append('title', youtubeTitle || '제목 없음')
      formData.append('description', youtubeDescription)
      formData.append('privacy', youtubePrivacy)
      formData.append('userId', user.id.toString())
      formData.append('mainCaption', mainCaption)

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

          {/* 오른쪽: 업로드 및 폼 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 파일 업로드 영역 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload {postType}</h3>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
              >
                <div className="text-green-500 text-6xl mb-4">📁</div>
                <h4 className="text-xl font-medium text-gray-900 mb-2">Click to upload or drag and drop</h4>
                <p className="text-gray-500 mb-4">or hover and paste from clipboard</p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                  <span>{postType === 'video' ? 'Video' : 'Image'}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                
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
                  📎 Import
                </label>
                
                {videoFile && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm text-green-800 font-medium">{videoFile.name}</span>
                      <span className="text-xs text-green-600">({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Main Caption</label>
              <textarea
                value={mainCaption}
                onChange={(e) => setMainCaption(e.target.value)}
                placeholder="Start writing your post here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                rows={4}
              />
            </div>

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
                  disabled={!videoFile || selectedAccounts.length === 0 || uploading}
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