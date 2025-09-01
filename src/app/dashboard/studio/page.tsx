'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 게시물 유형 정의
type PostType = 'text' | 'image' | 'video'

// 플랫폼 타입 정의
type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 
  'pinterest' | 'tiktok' | 'threads' | 'bluesky'

// 게시물 유형 정보 인터페이스
interface PostTypeInfo {
  type: PostType
  title: string
  description: string
  icon: string
  platforms: SocialPlatform[]
}

/**
 * 스튜디오 페이지 컴포넌트
 * 
 * 새 게시물 생성 시 게시물 유형을 선택하는 화면
 */
export default function StudioPage() {
  const router = useRouter()
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(null)

  // 지원되는 게시물 유형 정의
  const postTypes: PostTypeInfo[] = [
    {
      type: 'text',
      title: '텍스트 포스트',
      description: '텍스트만으로 간단한 포스트 작성',
      icon: '📝',
      platforms: ['facebook', 'twitter', 'threads', 'linkedin', 'bluesky']
    },
    {
      type: 'image',
      title: '이미지 포스트',
      description: '이미지와 함께하는 포스트',
      icon: '🖼️',
      platforms: ['instagram', 'facebook', 'twitter', 'linkedin', 'pinterest', 'tiktok']
    },
    {
      type: 'video',
      title: '동영상 포스트',
      description: '동영상 컨텐츠로 더 많은 참여 유도',
      icon: '🎥',
      platforms: ['youtube', 'tiktok', 'instagram', 'facebook', 'linkedin', 'twitter']
    }
  ]

  // 플랫폼별 아이콘 매핑
  const platformIcons: Record<SocialPlatform, string> = {
    facebook: '👍',
    twitter: '🐦',
    instagram: '📷',
    youtube: '📺',
    linkedin: '💼',
    pinterest: '📌',
    tiktok: '🎵',
    threads: '🧵',
    bluesky: '🦋'
  }

  /**
   * 게시물 유형 선택 핸들러
   * 선택된 유형으로 생성 페이지로 이동
   */
  const handlePostTypeSelect = (type: PostType) => {
    setSelectedPostType(type)
    router.push(`/dashboard/studio/create?type=${type}`)
  }

  return (
    <div className="h-full p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">새 게시물 만들기</h1>
        <p className="text-gray-600 mb-8">생성하려는 콘텐츠 유형을 선택하세요</p>
        
        {/* 게시물 유형 선택 카드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {postTypes.map((postType) => (
            <button
              key={postType.type}
              onClick={() => handlePostTypeSelect(postType.type)}
              className={`bg-white rounded-xl border-2 border-dashed p-8 text-center 
                transition-all hover:border-gray-400 hover:shadow-md ${
                selectedPostType === postType.type 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
              aria-label={`${postType.title} 선택`}
            >
              <div className="text-6xl mb-4">{postType.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{postType.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{postType.description}</p>
              
              {/* 지원 플랫폼 아이콘 */}
              <div className="flex justify-center space-x-1 flex-wrap">
                {postType.platforms.map((platform) => (
                  <div 
                    key={platform}
                    className="w-8 h-8 bg-gray-200 rounded-lg text-sm flex items-center justify-center m-1"
                    title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  >
                    {platformIcons[platform]}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* 계정 연결 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="text-blue-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-blue-800 text-sm">
              💡 계정을 더 연결하려면{' '}
              <button 
                onClick={() => router.push('/dashboard/connections')}
                className="text-blue-600 underline hover:text-blue-800 font-medium"
              >
                여기를 클릭하세요
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}