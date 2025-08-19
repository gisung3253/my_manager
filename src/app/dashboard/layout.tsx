'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const menuItems = [
    {
      category: 'Create',
      items: [
        { href: '/dashboard', icon: '📝', label: 'New post', active: pathname === '/dashboard' },
        { href: '/dashboard/studio', icon: '🎨', label: 'Studio', active: pathname === '/dashboard/studio' },
        { href: '/dashboard/bulk-tools', icon: '📦', label: 'Bulk tools', active: pathname === '/dashboard/bulk-tools' },
      ]
    },
    {
      category: 'Posts',
      items: [
        { href: '/dashboard/calendar', icon: '📅', label: 'Calendar', active: pathname === '/dashboard/calendar' },
        { href: '/dashboard/all', icon: '📋', label: 'All', active: pathname === '/dashboard/all' },
        { href: '/dashboard/scheduled', icon: '⏰', label: 'Scheduled', active: pathname === '/dashboard/scheduled' },
        { href: '/dashboard/posted', icon: '✅', label: 'Posted', active: pathname === '/dashboard/posted' },
        { href: '/dashboard/drafts', icon: '📄', label: 'Drafts', active: pathname === '/dashboard/drafts' },
      ]
    },
    {
      category: 'Configuration',
      items: [
        { href: '/dashboard/connections', icon: '🔗', label: 'Connections', active: pathname === '/dashboard/connections' },
        { href: '/dashboard/settings', icon: '⚙️', label: 'Settings', active: pathname === '/dashboard/settings' },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-sm flex flex-col">
        {/* 로고 */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Social Manager</span>
          </Link>
        </div>

        {/* Create Post 버튼 */}
        <div className="p-4">
          <Link href="/dashboard">
            <button className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>자료를 만들기</span>
            </button>
          </Link>
        </div>

        {/* 메뉴 */}
        <nav className="px-4 space-y-1 flex-1">
          {menuItems.map((section) => (
            <div key={section.category}>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 mt-6 first:mt-0">
                {section.category}
              </div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* 하단 사용자 정보 */}
        <div className="p-4 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full bg-gray-50 rounded-lg p-3 flex items-center space-x-3 hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">박</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900">박기성</div>
              <div className="text-xs text-gray-500">스타터 플랜</div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 드롭다운 메뉴 */}
          {showUserMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-sm text-gray-500">현재 바로와 결제를 받을 온라인 역세서 서비스입니다</div>
              </div>
              
              <div className="py-2">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <span>⚙️</span>
                  <span>설정</span>
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <span>💳</span>
                  <span>결제</span>
                </Link>
                <Link
                  href="/help"
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <span>❓</span>
                  <span>지원하다</span>
                </Link>
                <Link
                  href="/updates"
                  className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <span>📄</span>
                  <span>질구</span>
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    alert('로그아웃 되었습니다')
                  }}
                  className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <span>🔓</span>
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}