'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Pricing() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    setIsLoggedIn(!!user)
  }, [])

  const handleTrialClick = () => {
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <section id="pricing" className="px-6 py-32 bg-black text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-8">
          월 9,900원으로<br />
          모든 기능을 이용하세요
        </h2>
        
        <p className="text-xl text-gray-300 mb-12">
          해외 도구 대비 70% 저렴한 가격<br />
          7일 무료 체험 + 언제든 해지 가능
        </p>
        
        <div className="bg-white text-black p-8 rounded-sm max-w-md mx-auto">
          <div className="text-3xl font-bold mb-4">스타터 플랜</div>
          <div className="text-lg text-gray-600 mb-6">월 9,900원</div>
          
          <ul className="space-y-3 text-left mb-8">
            <li className="flex items-center space-x-3">
              <span className="text-green-600">✓</span>
              <span>5개 소셜계정 연결</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="text-green-600">✓</span>
              <span>무제한 포스팅</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="text-green-600">✓</span>
              <span>예약 포스팅</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="text-green-600">✓</span>
              <span>한국어 고객지원</span>
            </li>
          </ul>
          
          <button 
            onClick={handleTrialClick}
            className="block w-full bg-black text-white py-3 text-center hover:bg-gray-800 transition-colors"
          >
            7일 무료 체험 시작
          </button>
        </div>
      </div>
    </section>
  )
}