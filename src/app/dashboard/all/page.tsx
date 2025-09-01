'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PostAccount {
  id: number
  upload_status: string
  platform_post_id?: string
  platform_url?: string
  error_message?: string
  uploaded_at?: string
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
  posted_at?: string
  file_name?: string
  post_accounts: PostAccount[]
}

export default function AllPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'posted' | 'failed'>('all')
  const [user, setUser] = useState<any>(null)

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
  }, [user, filter])

  const fetchPosts = async () => {
    if (!user?.id) return
    
    try {
      const status = filter === 'all' ? 'all' : filter
      const response = await fetch(`/api/posts?userId=${user.id}&status=${status}`)
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      posting: 'bg-yellow-100 text-yellow-800',
      posted: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">All Posts</h1>
          <Link 
            href="/dashboard/studio"
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Create Post
          </Link>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-6">
          {['all', 'draft', 'scheduled', 'posted', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-6">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No posts found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' ? 'Get started by creating your first post' : `No ${filter} posts found`}
            </p>
            <Link 
              href="/dashboard/studio"
              className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {post.title || `${post.post_type} Post`}
                      </h3>
                      {getStatusBadge(post.status)}
                      <span className="text-sm text-gray-500 capitalize">
                        {post.post_type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                    {post.file_name && (
                      <p className="text-sm text-blue-600 mb-3">📎 {post.file_name}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <p>Created: {formatDate(post.created_at)}</p>
                    {post.scheduled_at && (
                      <p>Scheduled: {formatDate(post.scheduled_at)}</p>
                    )}
                    {post.posted_at && (
                      <p>Posted: {formatDate(post.posted_at)}</p>
                    )}
                  </div>
                </div>

                {/* 계정별 업로드 상태 */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Upload Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {post.post_accounts.map((account) => (
                      <div key={account.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          account.upload_status === 'success' ? 'bg-green-100 text-green-700' :
                          account.upload_status === 'failed' ? 'bg-red-100 text-red-700' :
                          account.upload_status === 'uploading' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {account.upload_status}
                        </span>
                        {account.platform_url && (
                          <a 
                            href={account.platform_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-xs"
                          >
                            View
                          </a>
                        )}
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