'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // localStorage에서 사용자 정보 확인
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/' // 페이지 새로고침
  }

  return (
    <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
          <span className="text-white font-bold text-sm">SM</span>
        </div>
        <span className="text-xl font-bold text-black">Social Manager</span>
      </Link>
      
      <div className="flex items-center space-x-8">
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-black transition-colors">기능</a>
          <a href="#pricing" className="text-gray-600 hover:text-black transition-colors">가격</a>
          <a href="#contact" className="text-gray-600 hover:text-black transition-colors">문의</a>
        </nav>
        
        {user ? (
          // 로그인된 상태: 사용자 이름 + 드롭다운
          <div className="relative group">
            <button className="bg-black text-white px-6 py-2 rounded-sm hover:bg-gray-800 transition-colors">
              {user.name}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-sm shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                대시보드
              </Link>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          // 로그인 안된 상태: 로그인 버튼
          <Link href="/login" className="bg-black text-white px-6 py-2 rounded-sm hover:bg-gray-800 transition-colors">
            로그인
          </Link>
        )}
      </div>
    </header>
  )
}