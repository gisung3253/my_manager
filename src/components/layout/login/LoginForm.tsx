'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LoginFormProps {
  isLogin: boolean
  onToggle: () => void
}

export default function LoginForm({ isLogin, onToggle }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const body = isLogin 
        ? { email, password }
        : { name, email, password, confirmPassword }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('user', JSON.stringify(data.user))
          router.push('/')
        } else {
          router.push('/onboarding/user-type')
        }
      } else {
        alert(data.error || '오류가 발생했습니다.')
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="max-w-md w-full space-y-8">
      {/* 제목 */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-black mb-4">
          {isLogin ? '로그인' : '회원가입'}
        </h2>
        <p className="text-gray-800">
          {isLogin ? '계정에 로그인하세요' : '새 계정을 만드세요'}
        </p>
      </div>

      <div className="space-y-6">
        {/* 구글 로그인 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center px-6 py-3 border border-gray-400 rounded-sm hover:bg-gray-50 transition-colors text-black font-medium"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          구글로 {isLogin ? '로그인' : '시작하기'}
        </button>

        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-400" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-gray-700 font-medium">또는</span>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-400 rounded-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-black placeholder-gray-600"
              placeholder="이름"
            />
          )}

          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-400 rounded-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-black placeholder-gray-600"
            placeholder="이메일"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-400 rounded-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-black placeholder-gray-600"
            placeholder="비밀번호"
          />

          {!isLogin && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-400 rounded-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-black placeholder-gray-600"
              placeholder="비밀번호 확인"
            />
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-black border-gray-400 rounded-sm focus:ring-black" />
                <span className="ml-2 text-gray-800">로그인 상태 유지</span>
              </label>
              <a href="#" className="text-black hover:text-gray-700 transition-colors font-medium">
                비밀번호 찾기
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        {/* 로그인/회원가입 전환 */}
        <div className="text-center text-sm pt-6">
          <span className="text-gray-800">
            {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          </span>
          <button
            onClick={onToggle}
            className="ml-2 text-black hover:text-gray-700 font-medium transition-colors"
          >
            {isLogin ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}