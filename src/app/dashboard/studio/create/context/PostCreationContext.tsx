'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// 연결된 계정 타입
export interface ConnectedAccount {
  id: number
  platform: string
  account_name: string
  profile_image_url?: string
}

// 플랫폼별 설정 타입
export interface PlatformSettings {
  youtube: {
    title: string
    description: string
    privacy: 'public' | 'unlisted' | 'private'
  }
  twitter: {
    hashtags: string
    thread: string[]
  }
  instagram: {
    altText: string
    location: string
  }
}

// 컨텍스트 타입 정의
interface PostCreationContextType {
  // 기본 정보
  postType: 'text' | 'image' | 'video'
  
  // 계정 관련
  connectedAccounts: ConnectedAccount[]
  setConnectedAccounts: (accounts: ConnectedAccount[]) => void
  selectedAccounts: number[]
  setSelectedAccounts: (accounts: number[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // 콘텐츠 관련
  mainCaption: string
  setMainCaption: (caption: string) => void
  mediaFile: File | null
  setMediaFile: (file: File | null) => void
  
  // 플랫폼 설정
  platformSettings: PlatformSettings
  updatePlatformSetting: (platform: keyof PlatformSettings, field: string, value: any) => void
  
  // 예약 관련
  isScheduled: boolean
  setIsScheduled: (scheduled: boolean) => void
  scheduledDate: string
  setScheduledDate: (date: string) => void
  scheduledTime: string
  setScheduledTime: (time: string) => void
  
  // 업로드 관련
  uploading: boolean
  setUploading: (uploading: boolean) => void
  uploadProgress: number
  setUploadProgress: (progress: number) => void
  
  // 유틸리티 함수
  handleAccountToggle: (accountId: number) => void
  getSelectedPlatforms: () => string[]
  hasTwitterAccount: () => boolean
  hasYouTubeAccount: () => boolean
  hasInstagramAccount: () => boolean
  getCharacterCount: () => number
  
  // 파일 핸들링
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleDragOver: (event: React.DragEvent) => void
  handleDrop: (event: React.DragEvent) => void
  
  // 제출
  handleSubmit: () => Promise<void>
}

// 컨텍스트 생성
export const PostCreationContext = createContext<PostCreationContextType | undefined>(undefined)

// Provider 컴포넌트
interface PostCreationProviderProps {
  children: ReactNode
  router: ReturnType<typeof useRouter>
}

export function PostCreationProvider({ children, router }: PostCreationProviderProps) {
  const searchParams = useSearchParams()
  const postType = (searchParams.get('type') as 'text' | 'image' | 'video') || 'text'
  // 계정 관련 상태
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  
  // 기본 콘텐츠 상태
  const [mainCaption, setMainCaption] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  
  // 플랫폼별 설정 상태
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    youtube: {
      title: '',
      description: '',
      privacy: 'public'
    },
    twitter: {
      hashtags: '',
      thread: ['']
    },
    instagram: {
      altText: '',
      location: ''
    }
  })
  
  // 예약 관련 상태
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  
  // 업로드 관련 상태
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // 플랫폼 설정 업데이트 함수
  const updatePlatformSetting = (
    platform: keyof PlatformSettings, 
    field: string, 
    value: any
  ) => {
    setPlatformSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }))
  }
  
  // 계정 선택/해제 토글
  const handleAccountToggle = (accountId: number) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }
  
  // 선택된 플랫폼 목록 가져오기
  const getSelectedPlatforms = () => {
    return selectedAccounts.map(id => {
      const account = connectedAccounts.find(acc => acc.id === id)
      return account?.platform.toLowerCase()
    }).filter(Boolean) as string[]
  }
  
  // 특정 플랫폼 계정이 선택되었는지 확인
  const hasTwitterAccount = () => getSelectedPlatforms().includes('twitter')
  const hasYouTubeAccount = () => getSelectedPlatforms().includes('youtube')
  const hasInstagramAccount = () => getSelectedPlatforms().includes('instagram')
  
  // Twitter 글자수 계산
  const getCharacterCount = () => {
    const hashtagsLength = platformSettings.twitter.hashtags 
      ? platformSettings.twitter.hashtags.split(' ').filter(tag => tag.startsWith('#')).join(' ').length 
      : 0
    return mainCaption.length + hashtagsLength
  }
  
  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setMediaFile(file)
  }
  
  // 드래그 앤 드롭 핸들러
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) setMediaFile(file)
  }
  
  /**
   * 게시물 업로드/예약 처리 함수
   */
  const handleSubmit = async () => {
    // 1. 입력 검증
    if (postType !== 'text' && !mediaFile) {
      alert(`${postType === 'image' ? '이미지' : '동영상'} 파일을 선택해주세요.`)
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

    if (hasYouTubeAccount() && !platformSettings.youtube.title.trim()) {
      alert('YouTube 업로드를 위해 제목을 입력해주세요.')
      return
    }

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

    // 2. 업로드 시작
    setUploading(true)
    setUploadProgress(0)

    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('로그인이 필요합니다.')
        return
      }
      const user = JSON.parse(userStr)

      // 3. 공통 FormData 준비
      const formData = new FormData()
      formData.append('userId', user.id.toString())
      formData.append('title', platformSettings.youtube.title || '제목 없음')
      formData.append('mainCaption', mainCaption || '')
      formData.append('postType', postType)
      formData.append('selectedAccounts', JSON.stringify(selectedAccounts))
      
      if (mediaFile) formData.append('video', mediaFile)

      // 4. 예약 게시물 처리
      if (isScheduled) {
        formData.append('isScheduled', 'true')
        const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00+09:00` // 한국 시간대
        formData.append('scheduledAt', scheduledDateTime)
        
        // 플랫폼 설정 추가
        formData.append('platformSettings', JSON.stringify({
          youtube: platformSettings.youtube,
          twitter: {
            hashtags: platformSettings.twitter.hashtags
          },
          instagram: {
            altText: platformSettings.instagram.altText,
            location: platformSettings.instagram.location
          }
        }))

        try {
          // 진행 상태 표시
          setUploadProgress(30)
          
          const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
          })

          setUploadProgress(80)
          const result = await response.json()
          setUploadProgress(100)
          
          if (result.success) {
            const displayTime = new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            })
            alert(`✅ 게시물이 예약되었습니다!\n예약 시간: ${displayTime}`)
            router.push('/dashboard/scheduled')
          } else {
            alert(`❌ 예약 저장에 실패했습니다: ${result.error || '알 수 없는 오류'}`)
          }
        } catch (error) {
          console.error('예약 처리 오류:', error)
          alert('❌ 예약 처리 중 오류가 발생했습니다.')
        }
        
        return
      }

      // 5. 즉시 게시물 처리
      try {
        // Twitter 특화 데이터
        if (hasTwitterAccount()) {
          formData.append('twitterHashtags', platformSettings.twitter.hashtags)
          formData.append('twitterThread', JSON.stringify(platformSettings.twitter.thread))
        }
        
        // Instagram 특화 데이터
        if (hasInstagramAccount()) {
          formData.append('instagramAltText', platformSettings.instagram.altText)
          formData.append('instagramLocation', platformSettings.instagram.location)
        }
        
        // 진행 상태 업데이트
        setUploadProgress(20)
        
        // API 호출
        const response = await fetch('/api/upload/multi', {
          method: 'POST',
          body: formData
        })

        setUploadProgress(70)
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
          alert(`❌ 업로드 중 오류가 발생했습니다: ${result.error || ''}`)
        }
      } catch (error) {
        console.error('업로드 오류:', error)
        alert('❌ 업로드 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('처리 오류:', error)
      alert('❌ 요청 처리 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }
  
  const value = {
    postType,
    connectedAccounts, setConnectedAccounts,
    selectedAccounts, setSelectedAccounts,
    loading, setLoading,
    mainCaption, setMainCaption,
    mediaFile, setMediaFile,
    platformSettings, updatePlatformSetting,
    isScheduled, setIsScheduled,
    scheduledDate, setScheduledDate,
    scheduledTime, setScheduledTime,
    uploading, setUploading,
    uploadProgress, setUploadProgress,
    handleAccountToggle,
    getSelectedPlatforms,
    hasTwitterAccount, hasYouTubeAccount, hasInstagramAccount,
    getCharacterCount,
    handleFileUpload, handleDragOver, handleDrop,
    handleSubmit
  }
  
  return (
    <PostCreationContext.Provider value={value}>
      {children}
    </PostCreationContext.Provider>
  )
}

// 커스텀 훅
export const usePostCreation = () => {
  const context = useContext(PostCreationContext)
  if (context === undefined) {
    throw new Error('usePostCreation must be used within a PostCreationProvider')
  }
  return context
}