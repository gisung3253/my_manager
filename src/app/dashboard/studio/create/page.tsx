'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PostCreationProvider, usePostCreation } from './context/PostCreationContext'

// 분리된 컴포넌트 가져오기
import AccountSelection from './components/AccountSelection'
import ContentInput from './components/ContentInput'
import PlatformSettings from './components/PlatformSettings'
import ScheduleSettings from './components/ScheduleSettings'
import UploadProgress from './components/UploadProgress'
import ActionButtons from './components/ActionButtons'

/**
 * 게시물 작성 컴포넌트
 */
function CreatePostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postType = searchParams.get('type') as 'text' | 'image' | 'video'
  const { isScheduled, setIsScheduled } = usePostCreation()

  if (!postType || !['text', 'image', 'video'].includes(postType)) {
    return (
      <div className="h-full p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">올바른 게시물 유형을 선택해주세요</h1>
            <button 
              onClick={() => router.push('/dashboard/studio')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {postType === 'text' ? '텍스트 게시물 작성' : 
               postType === 'image' ? '이미지 게시물 작성' : 
               '동영상 게시물 작성'}
            </h1>
            <p className="text-gray-600">콘텐츠를 업로드하고 공유할 계정을 선택하세요</p>
          </div>
          
          {/* 예약 토글 */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">게시물 예약</span>
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
            <AccountSelection />
          </div>

          {/* 오른쪽: 콘텐츠 입력 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 콘텐츠 타입별 UI */}
            <ContentInput />
            
            {/* 플랫폼별 설정 */}
            <PlatformSettings />
            
            {/* 예약 설정 */}
            <ScheduleSettings />
            
            {/* 업로드 진행 상태 */}
            <UploadProgress />
            
            {/* 액션 버튼 */}
            <ActionButtons />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 게시물 작성 페이지 (Suspense 래퍼)
 */
export default function CreatePostPage() {
  const router = useRouter()
  
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
      <PostCreationProvider router={router}>
        <CreatePostContent />
      </PostCreationProvider>
    </Suspense>
  )
}