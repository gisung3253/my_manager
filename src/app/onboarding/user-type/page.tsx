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
    },
    {
      id: 'creator',
      title: 'Creator',
      description: '팔로워를 늘려가고 있어요',
    },
    {
      id: 'agency',
      title: 'Agency',
      description: '클라이언트 계정을 관리해요',
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: '큰 회사 팀이에요',
    },
    {
      id: 'small-business',
      title: 'Small Business',
      description: '작은 비즈니스를 운영해요',
    },
    {
      id: 'personal',
      title: 'Personal',
      description: '개인적으로 사용해요',
    }
  ]

  const handleNext = () => {
    router.push('/onboarding/connect-accounts')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="px-6 py-6 flex items-center justify-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          <span className="text-xl font-bold text-black">Social Manager</span>
        </Link>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-6 py-16 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            어떤 유형이 가장 비슷하신가요?
          </h1>
          <p className="text-gray-600">
            맞춤형 경험을 제공하기 위해 알려주세요
          </p>
        </div>

        {/* 사용자 타입 선택 */}
        <div className="space-y-3 mb-12">
          {userTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`w-full p-6 border rounded-sm text-left transition-all hover:border-gray-400 ${
                selectedType === type.id
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-black">{type.title}</h3>
                  <p className="text-gray-600">{type.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedType === type.id 
                    ? 'bg-black border-black' 
                    : 'border-gray-300'
                }`}></div>
              </div>
            </button>
          ))}
        </div>

        {/* 다음 버튼 */}
        <div className="text-center">
          <button
            onClick={handleNext}
            className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}