'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UserTypePage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState('')

  const userTypes = [
    {
      id: 'founder',
      title: 'Founder',
      description: '비즈니스를 구축하고 있어요',
      icon: '💼'
    },
    {
      id: 'creator',
      title: 'Creator',
      description: '팔로워를 늘려가고 있어요',
      icon: '🎨'
    },
    {
      id: 'agency',
      title: 'Agency',
      description: '클라이언트 계정을 관리해요',
      icon: '🏢'
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: '큰 회사 팀이에요',
      icon: '🏭'
    },
    {
      id: 'small-business',
      title: 'Small Business',
      description: '작은 비즈니스를 운영해요',
      icon: '🏪'
    },
    {
      id: 'personal',
      title: 'Personal',
      description: '개인적으로 사용해요',
      icon: '👤'
    }
  ]

  const handleNext = () => {
    // 선택 없이 바로 다음 페이지로
    router.push('/onboarding/connect-accounts')
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
          <div className="w-16 h-1 bg-gray-300"></div>
          <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div className="w-16 h-1 bg-gray-300"></div>
          <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
            3
          </div>
        </div>

        <div className="w-8"></div> {/* 스페이서 */}
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-green-500 text-sm font-medium mb-2">거의 완료</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            어떤 유형이 가장 비슷하신가요?
          </h1>
        </div>

        {/* 사용자 타입 선택 */}
        <div className="space-y-4 mb-12">
          {userTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all hover:border-blue-300 ${
                selectedType === type.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                {selectedType === type.id && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {selectedType !== type.id && (
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                )}
                <div className="text-2xl">{type.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{type.title}</h3>
                  <p className="text-gray-600">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 다음 버튼 */}
        <div className="flex justify-end">
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