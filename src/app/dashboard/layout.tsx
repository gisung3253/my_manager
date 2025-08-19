'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

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
              <span>Create post</span>
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
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">홍</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">홍길동</div>
              <div className="text-xs text-gray-500">Starter Plan</div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}