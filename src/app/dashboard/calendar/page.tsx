'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Post {
  id: number
  title?: string
  content: string
  post_type: string
  status: string
  created_at: string
  scheduled_at?: string
  posted_at?: string
  file_name?: string
  post_accounts: {
    id: number
    upload_status: string
    connected_accounts: {
      platform: string
      account_name: string
    }
  }[]
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchPosts()
    }
  }, [user])

  const fetchPosts = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/posts?userId=${user.id}&status=all`)
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      weekDates.push(currentDate)
    }
    return weekDates
  }

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)

    // 달의 시작 요일에 맞춰 이전 달 날짜들도 포함
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    // 달의 마지막 요일에 맞춰 다음 달 날짜들도 포함
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

    const dates = []
    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toDateString()
    return posts.filter(post => {
      const postDate = post.scheduled_at 
        ? new Date(post.scheduled_at) 
        : post.posted_at 
        ? new Date(post.posted_at) 
        : new Date(post.created_at)
      return postDate.toDateString() === dateStr
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-500'
      case 'scheduled': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      case 'posting': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDateRange = () => {
    if (viewType === 'week') {
      const weekDates = getWeekDates(currentDate)
      const start = weekDates[0]
      const end = weekDates[6]
      
      if (start.getMonth() === end.getMonth()) {
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
      } else {
        return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
      }
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
  }

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate)
    
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {days.map((day, index) => {
            const date = weekDates[index]
            const isToday = date.toDateString() === new Date().toDateString()
            
            return (
              <div key={day} className="p-4 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                <div className="mb-2">{day}</div>
                <div className={`text-lg ${isToday ? 'bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* 콘텐츠 그리드 */}
        <div className="grid grid-cols-7 min-h-96">
          {weekDates.map((date, index) => {
            const dayPosts = getPostsForDate(date)
            
            return (
              <div key={index} className="border-r border-gray-200 last:border-r-0 p-4 min-h-96">
                {dayPosts.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm mt-8">
                    No posts
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayPosts.slice(0, 4).map((post) => {
                      const displayTime = post.scheduled_at 
                        ? new Date(post.scheduled_at).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: 'Asia/Seoul'
                          })
                        : post.posted_at 
                        ? new Date(post.posted_at).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: 'Asia/Seoul'
                          })
                        : 'Draft'
                      
                      return (
                        <div
                          key={post.id}
                          className={`p-2 rounded-md text-xs text-white cursor-pointer hover:opacity-80 ${getStatusColor(post.status)}`}
                          title={post.content}
                        >
                          <div className="font-medium truncate">
                            {displayTime}
                          </div>
                          <div className="truncate">
                            {post.title || `${post.post_type} post`}
                          </div>
                          <div className="text-xs opacity-80">
                            {post.post_accounts.length} accounts
                          </div>
                        </div>
                      )
                    })}
                    {dayPosts.length > 4 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayPosts.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthDates = getMonthDates(currentDate)
    const weeks = []
    
    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7))
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {days.map((day) => (
            <div key={day} className="p-4 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 월 그리드 */}
        <div className="grid grid-rows-6">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
              {week.map((date, dayIndex) => {
                const dayPosts = getPostsForDate(date)
                const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                const isToday = date.toDateString() === new Date().toDateString()
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`border-r border-gray-200 last:border-r-0 p-2 h-24 ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          className={`w-full h-1.5 rounded ${getStatusColor(post.status)}`}
                          title={`${post.title || post.post_type} - ${post.status}`}
                        />
                      ))}
                      {dayPosts.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayPosts.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <div className="text-gray-500">{formatDateRange()}</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-white rounded-lg border border-gray-200">
              <button 
                onClick={() => setViewType('week')}
                className={`px-4 py-2 rounded-l-lg ${viewType === 'week' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setViewType('month')}
                className={`px-4 py-2 rounded-r-lg ${viewType === 'month' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Month
              </button>
            </div>
            <button 
              onClick={goToToday}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Today
            </button>
            <div className="flex space-x-2">
              <button 
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <button 
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
            <Link 
              href="/dashboard/studio"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              New Post
            </Link>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Posted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Failed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>Draft</span>
          </div>
        </div>

        {/* 캘린더 뷰 */}
        {viewType === 'week' ? renderWeekView() : renderMonthView()}
      </div>
    </div>
  )
}