import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // FormData에서 데이터 추출
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const accountId = formData.get('accountId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const privacy = formData.get('privacy') as 'public' | 'unlisted' | 'private'
    const userId = formData.get('userId') as string

    if (!videoFile || !accountId || !title || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 연결된 계정 정보 가져오기
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', parseInt(accountId))
      .eq('user_id', parseInt(userId))
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 })
    }

    // 파일을 Buffer로 변환
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 토큰 갱신 확인
    let accessToken = account.access_token
    if (account.expires_at && new Date(account.expires_at) < new Date()) {
      console.log('Access token expired, refreshing...')
      const refreshResult = await refreshAccessToken(account.refresh_token, parseInt(accountId))
      if (refreshResult.success) {
        accessToken = refreshResult.accessToken
      } else {
        return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 401 })
      }
    }

    // YouTube API 업로드
    const uploadResponse = await uploadToYoutube({
      buffer,
      fileName: videoFile.name,
      title,
      description: description || '',
      privacy: privacy || 'public',
      accessToken
    })

    if (uploadResponse.success) {
      // 즉시 업로드 시에도 게시물을 DB에 저장
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: parseInt(userId),
          title,
          content: description || '',
          post_type: 'video',
          status: 'posted',
          posted_at: new Date().toISOString(),
          file_name: videoFile.name,
          platform_settings: { youtube: { privacy } },
          platform_results: { youtube: uploadResponse }
        })
        .select()
        .single()

      if (postError) {
        console.error('Failed to save post:', postError)
      } else {
        // post_accounts 테이블에도 기록
        const { error: accountError } = await supabase
          .from('post_accounts')
          .insert({
            post_id: post.id,
            account_id: parseInt(accountId),
            upload_status: 'success',
            platform_post_id: uploadResponse.videoId,
            platform_url: `https://www.youtube.com/watch?v=${uploadResponse.videoId}`,
            uploaded_at: new Date().toISOString()
          })

        if (accountError) {
          console.error('Failed to save post account:', accountError)
        }
      }

      return NextResponse.json({
        success: true,
        videoId: uploadResponse.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.videoId}`
      })
    } else {
      // 실패한 경우도 DB에 기록
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: parseInt(userId),
          title,
          content: description || '',
          post_type: 'video',
          status: 'failed',
          file_name: videoFile.name,
          platform_settings: { youtube: { privacy } }
        })
        .select()
        .single()

      if (!postError && post) {
        await supabase
          .from('post_accounts')
          .insert({
            post_id: post.id,
            account_id: parseInt(accountId),
            upload_status: 'failed',
            error_message: uploadResponse.error
          })
      }

      return NextResponse.json({ 
        error: uploadResponse.error || 'Upload failed' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('YouTube upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function refreshAccessToken(refreshToken: string, accountId: number) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const tokens = await response.json()

    if (!tokens.access_token) {
      console.error('Failed to refresh token:', tokens)
      return { success: false, error: 'Token refresh failed' }
    }

    // 새 토큰을 DB에 저장
    const { error: updateError } = await supabase
      .from('connected_accounts')
      .update({
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000)
      })
      .eq('id', accountId)

    if (updateError) {
      console.error('Failed to update token in DB:', updateError)
    }

    return { success: true, accessToken: tokens.access_token }
  } catch (error) {
    console.error('Token refresh error:', error)
    return { success: false, error: 'Token refresh failed' }
  }
}

async function uploadToYoutube({
  buffer,
  fileName,
  title,
  description,
  privacy,
  accessToken
}: {
  buffer: Buffer
  fileName: string
  title: string
  description: string
  privacy: 'public' | 'unlisted' | 'private'
  accessToken: string
}) {
  try {
    // YouTube API resumable upload 시작
    const metadata = {
      snippet: {
        title,
        description,
        tags: [],
        categoryId: '22', // People & Blogs
        defaultLanguage: 'ko',
        defaultAudioLanguage: 'ko'
      },
      status: {
        privacyStatus: privacy, // 사용자가 선택한 공개 설정
        selfDeclaredMadeForKids: false
      }
    }

    // Step 1: Resumable upload session 시작
    const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': buffer.length.toString(),
        'X-Upload-Content-Type': 'video/*'
      },
      body: JSON.stringify(metadata)
    })

    if (!initResponse.ok) {
      const error = await initResponse.text()
      console.error('YouTube upload init failed:', error)
      try {
        const errorObj = JSON.parse(error)
        console.error('YouTube upload init failed:', errorObj)
        return { success: false, error: errorObj.error?.message || 'Upload initialization failed' }
      } catch {
        console.error('YouTube upload init failed:', error)
        return { success: false, error: 'Upload initialization failed' }
      }
    }

    const uploadUrl = initResponse.headers.get('location')
    if (!uploadUrl) {
      return { success: false, error: 'No upload URL received' }
    }

    // Step 2: 실제 파일 업로드
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*'
      },
      body: new Uint8Array(buffer)
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      console.error('YouTube file upload failed:', error)
      return { success: false, error: 'File upload failed' }
    }

    const result = await uploadResponse.json()
    
    console.log('YouTube upload successful:', result.id)
    return { 
      success: true, 
      videoId: result.id,
      title: result.snippet.title
    }

  } catch (error) {
    console.error('YouTube upload error:', error)
    return { success: false, error: 'Upload failed' }
  }
}