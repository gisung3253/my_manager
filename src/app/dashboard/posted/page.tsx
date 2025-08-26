'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PostAccount {
  id: number
  upload_status: string
  platform_post_id?: string
  platform_url?: string
  uploaded_at?: string
  error_message?: string
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
  scheduled_at?: string
  posted_at: string
  file_name?: string
  platform_results?: any[]
  post_accounts: PostAccount[]
}

export default function PostedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchPostedPosts()
    }
  }, [user, sortBy])

  const fetchPostedPosts = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/posts?userId=${user.id}&status=posted`)
      const data = await response.json()
      
      let sortedPosts = data.posts || []
      if (sortBy === 'newest') {
        sortedPosts = sortedPosts.sort((a: Post, b: Post) => 
          new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
        )
      } else {
        sortedPosts = sortedPosts.sort((a: Post, b: Post) => 
          new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()
        )
      }
      
      setPosts(sortedPosts)
    } catch (error) {
      console.error('Failed to fetch posted posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diff = now.getTime() - posted.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  const getSuccessCount = (post: Post) => {
    return post.post_accounts.filter(account => account.upload_status === 'success').length
  }

  const getFailedCount = (post: Post) => {
    return post.post_accounts.filter(account => account.upload_status === 'failed').length
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      youtube: '🎥',
      instagram: '📸',
      twitter: '🐦',
      facebook: '📘',
      tiktok: '🎵',
      linkedin: '💼'
    }
    return icons[platform.toLowerCase() as keyof typeof icons] || '📱'
  }

  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Posted Content</h1>
          <div className="flex items-center gap-4">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <Link 
              href="/dashboard/studio"
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Create Post
            </Link>
          </div>
        </div>

        {/* Stats */}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{posts.length}</div>
              <div className="text-sm text-green-800">Total Posts</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {posts.reduce((sum, post) => sum + getSuccessCount(post), 0)}
              </div>
              <div className="text-sm text-blue-800">Successful Uploads</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {posts.reduce((sum, post) => sum + getFailedCount(post), 0)}
              </div>
              <div className="text-sm text-red-800">Failed Uploads</div>
            </div>
          </div>
        )}
        
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-6">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No posted content yet</h3>
            <p className="text-gray-600 mb-6">Your successfully posted content will appear here</p>
            <Link 
              href="/dashboard/studio"
              className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const successCount = getSuccessCount(post)
              const failedCount = getFailedCount(post)
              
              return (
                <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {post.title || `${post.post_type} Post`}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          posted
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {post.post_type}
                        </span>
                        {successCount > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {successCount}/{post.post_accounts.length} successful
                          </span>
                        )}
                        {failedCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {failedCount} failed
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                      {post.file_name && (
                        <p className="text-sm text-blue-600 mb-3">📎 {post.file_name}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-green-600 mb-1">
                        {getTimeAgo(post.posted_at)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(post.posted_at)}
                      </div>
                      {post.scheduled_at && (
                        <div className="text-xs text-gray-400 mt-1">
                          Originally scheduled: {formatDate(post.scheduled_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Platform Results */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {post.post_accounts.map((account) => (
                        <div 
                          key={account.id} 
                          className={`rounded-lg p-4 ${
                            account.upload_status === 'success' 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {getPlatformIcon(account.connected_accounts.platform)}
                              </span>
                              {account.connected_accounts.profile_image_url ? (
                                <img 
                                  src={account.connected_accounts.profile_image_url} 
                                  alt={account.connected_accounts.account_name}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                                  {account.connected_accounts.platform[0].toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-gray-900">
                                {account.connected_accounts.account_name}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              account.upload_status === 'success' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {account.upload_status}
                            </span>
                          </div>
                          
                          {account.upload_status === 'success' && account.platform_url && (
                            <div className="mt-2">
                              <a 
                                href={account.platform_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                🔗 View on {account.connected_accounts.platform}
                              </a>
                              {account.uploaded_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Uploaded: {formatDate(account.uploaded_at)}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {account.upload_status === 'failed' && account.error_message && (
                            <div className="mt-2">
                              <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                                {account.error_message}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}