'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PostAccount {
  id: number
  upload_status: string
  connected_accounts: {
    platform: string
    account_name: string
    profile_image_url?: string
  }
}

interface Post {
  id: number
  title?: string
  content: string
  post_type: string
  status: string
  created_at: string
  scheduled_at: string
  file_name?: string
  post_accounts: PostAccount[]
}

interface QueueJob {
  id: string
  postId: number
  scheduledFor: string
  data: {
    title: string
    accountCount: number
  }
}

interface QueueStatus {
  queue: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }
  upcomingJobs: QueueJob[]
  isProcessing: boolean
}

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchScheduledPosts()
      fetchQueueStatus()
      
      // 5초마다 큐 상태 업데이트
      const interval = setInterval(fetchQueueStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchScheduledPosts = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/posts?userId=${user.id}&status=scheduled`)
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('/api/queue/status')
      const data = await response.json()
      setQueueStatus(data)
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
    }
  }

  const cancelScheduledPost = async (postId: number) => {
    if (!confirm('정말로 이 예약된 게시물을 취소하시겠습니까?')) return
    
    try {
      const response = await fetch('/api/posts/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          userId: user?.id
        })
      })

      const data = await response.json()

      if (data.success) {
        // 성공 시 목록에서 해당 게시물 제거
        setPosts(posts.filter(post => post.id !== postId))
        alert('예약이 성공적으로 취소되었습니다!')
      } else {
        alert(`취소 실패: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to cancel post:', error)
      alert('취소 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    
    if (diff < 0) {
      return 'Overdue'
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 1) {
      return `in ${minutes}m`
    } else if (hours < 24) {
      return `in ${hours}h ${minutes}m`
    } else {
      // 한국 시간으로 명시적 변환
      const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000)) // UTC + 9시간
      return koreanTime.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getTimeUntilExecution = (scheduledAt: string) => {
    const scheduled = new Date(scheduledAt)
    const now = new Date()
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff <= 0) return 'Executing now...'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 1) {
      return `${minutes} minutes`
    } else if (hours < 24) {
      return `${hours}h ${minutes}m`
    } else {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
  }

  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-56 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scheduled Posts</h1>
          <Link 
            href="/dashboard/studio"
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Schedule Post
          </Link>
        </div>

        {/* Queue Status */}
        {queueStatus && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.queue.delayed}</div>
              <div className="text-sm text-blue-800">Scheduled</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{queueStatus.queue.active}</div>
              <div className="text-sm text-yellow-800">Processing</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{queueStatus.queue.completed}</div>
              <div className="text-sm text-green-800">Completed</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{queueStatus.queue.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{queueStatus.queue.waiting}</div>
              <div className="text-sm text-gray-800">Waiting</div>
            </div>
          </div>
        )}

        {/* Upcoming Jobs */}
        {queueStatus && queueStatus.upcomingJobs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Next Executions</h3>
            <div className="space-y-2">
              {queueStatus.upcomingJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex justify-between items-center">
                  <span className="text-blue-800">
                    Post #{job.postId}: {job.data.title} 
                    <span className="text-blue-600 text-sm ml-2">
                      ({job.data.accountCount} accounts)
                    </span>
                  </span>
                  <span className="text-blue-600 text-sm">
                    {getTimeUntilExecution(job.scheduledFor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-6">⏰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No scheduled posts</h3>
            <p className="text-gray-600 mb-6">Schedule your first post to see it here</p>
            <Link 
              href="/dashboard/studio"
              className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Schedule Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .map((post) => (
                <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {post.title || `${post.post_type} Post`}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          scheduled
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {post.post_type}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                      {post.file_name && (
                        <p className="text-sm text-blue-600 mb-3">📎 {post.file_name}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-blue-600 mb-1">
                        {(() => {
                          const scheduledDate = new Date(post.scheduled_at)
                          const koreanTime = new Date(scheduledDate.getTime())
                          
                          // 현재 시간과 비교
                          const now = new Date()
                          const diff = koreanTime.getTime() - now.getTime()
                          
                          if (diff < 0) {
                            return 'Overdue'
                          }
                          
                          const hours = Math.floor(diff / (1000 * 60 * 60))
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                          
                          if (hours < 1) {
                            return `${minutes}분 후`
                          } else if (hours < 24) {
                            return `${hours}시간 ${minutes}분 후`
                          } else {
                            return koreanTime.toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">
                        예약 시간: {new Date(post.scheduled_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <button
                        onClick={() => cancelScheduledPost(post.id)}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* 계정별 상태 */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Will upload to {post.post_accounts.length} account(s):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {post.post_accounts.map((account) => (
                        <div key={account.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                          {account.connected_accounts.profile_image_url ? (
                            <img 
                              src={account.connected_accounts.profile_image_url} 
                              alt={account.connected_accounts.account_name}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                              {account.connected_accounts.platform[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium">{account.connected_accounts.account_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            ready
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}