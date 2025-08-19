'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PricingPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState('creator')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'starter',
      name: '스타터',
      description: '개인 크리에이터를 위한',
      monthlyPrice: 9900,
      yearlyPrice: 99000,
      features: [
        '5개 소셜계정 연결',
        '플랫폼별 여러 계정',
        '무제한 포스팅',
        '예약 포스팅',
        '캐러셀 포스트',
        '250MB 파일 업로드',
        '한국어 고객지원'
      ]
    },
    {
      id: 'creator',
      name: '크리에이터',
      description: '성장하는 크리에이터를 위한',
      monthlyPrice: 19900,
      yearlyPrice: 199000,
      popular: true,
      features: [
        '15개 소셜계정 연결',
        '플랫폼별 여러 계정',
        '무제한 포스팅',
        '예약 포스팅',
        '캐러셀 포스트',
        '500MB 파일 업로드',
        '벌크 비디오 스케줄링',
        '콘텐츠 스튜디오 접근',
        '한국어 고객지원'
      ]
    },
    {
      id: 'pro',
      name: '프로',
      description: '확장하는 브랜드를 위한',
      monthlyPrice: 29900,
      yearlyPrice: 299000,
      features: [
        '무제한 계정 연결',
        '플랫폼별 여러 계정',
        '무제한 포스팅',
        '예약 포스팅',
        '캐러셀 포스트',
        '500MB 파일 업로드',
        '벌크 비디오 스케줄링',
        '콘텐츠 스튜디오 접근',
        '바이럴 성장 컨설팅',
        '우선 고객지원'
      ]
    }
  ]

  const handleStartTrial = () => {
    // 무료 체험 시작 (대시보드로 이동)
    alert(`${plans.find(p => p.id === selectedPlan)?.name} 플랜 7일 무료 체험을 시작합니다!`)
    router.push('/dashboard')
  }

  const formatPrice = (plan: typeof plans[0]) => {
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
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
          <div className="w-16 h-1 bg-green-500"></div>
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div className="w-16 h-1 bg-green-500"></div>
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            3
          </div>
        </div>

        <div className="w-8"></div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-6 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            플랜을 선택하세요
          </h1>
          <p className="text-gray-600 mb-8">
            7일 무료 체험 - 언제든 취소 가능
          </p>

          {/* 월간/연간 토글 */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월간
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingPeriod === 'yearly'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              연간
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                20% 할인
              </span>
            </button>
          </div>
        </div>

        {/* 플랜 카드들 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-8 border-2 transition-all cursor-pointer hover:shadow-lg ${
                selectedPlan === plan.id
                  ? 'border-green-500 shadow-lg'
                  : 'border-gray-200'
              } ${plan.popular ? 'relative' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-sm px-4 py-1 rounded-full">
                    가장 인기
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ₩{formatPrice(plan)}
                  </span>
                  <span className="text-gray-600">
                    /{billingPeriod === 'monthly' ? '월' : '년'}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.id && (
                <div className="text-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 시작 버튼 */}
        <div className="text-center">
          <button
            onClick={handleStartTrial}
            className="bg-green-500 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
          >
            7일 무료 체험 시작 →
          </button>
          <p className="text-sm text-gray-600 mt-4">
            ₩0 오늘 결제, 언제든 취소 가능
          </p>
        </div>
      </div>
    </div>
  )
}