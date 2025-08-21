'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const userParam = searchParams.get('user')
    
    if (userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        localStorage.setItem('user', JSON.stringify(user))
        router.push('/')
      } catch (error) {
        console.error('사용자 정보 처리 오류:', error)
        router.push('/login?error=invalid_user_data')
      }
    } else {
      router.push('/login?error=no_user_data')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black mb-4">로그인 중...</h1>
        <p className="text-gray-600">잠시만 기다려주세요</p>
      </div>
    </div>
  )
}

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">로딩 중...</h1>
          <p className="text-gray-600">잠시만 기다려주세요</p>
        </div>
      </div>
    }>
      <LoginSuccessContent />
    </Suspense>
  )
}