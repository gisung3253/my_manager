import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const mediaFile = formData.get('video') as File | null // video 대신 media로, null 허용
    const selectedAccountsStr = formData.get('selectedAccounts') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const privacy = formData.get('privacy') as 'public' | 'unlisted' | 'private'
    const userId = formData.get('userId') as string
    const mainCaption = formData.get('mainCaption') as string
    const postType = formData.get('postType') as string || 'text'
    const twitterHashtags = formData.get('twitterHashtags') as string || ''

    if (!selectedAccountsStr || !userId || !mainCaption) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const selectedAccounts = JSON.parse(selectedAccountsStr)

    // 먼저 게시물을 posts 테이블에 저장
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: parseInt(userId),
        title: title || mainCaption.substring(0, 50) || 'Untitled Post',
        content: mainCaption || description || '',
        post_type: postType,
        status: 'posting',
        file_name: mediaFile?.name || null,
        platform_settings: { youtube: { privacy } }
      })
      .select()
      .single()

    if (postError || !post) {
      console.error('Failed to create post:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // 각 계정에 대해 post_accounts 레코드 생성 및 업로드
    const uploadResults = []
    let hasSuccess = false

    for (const accountId of selectedAccounts) {
      // 계정 정보 가져오기
      const { data: account, error: accountError } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', parseInt(userId))
        .single()

      if (accountError || !account) {
        // 실패 기록
        await supabase
          .from('post_accounts')
          .insert({
            post_id: post.id,
            account_id: accountId,
            upload_status: 'failed',
            error_message: 'Account not found'
          })
        
        uploadResults.push({
          accountId,
          success: false,
          error: 'Account not found'
        })
        
        continue
      }

      if (account.platform.toLowerCase() === 'youtube') {
        // YouTube는 비디오 파일이 필요
        if (!mediaFile) {
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'failed',
              error_message: 'YouTube requires a video file'
            })

          uploadResults.push({
            accountId,
            accountName: account.account_name,
            platform: 'YouTube',
            success: false,
            error: 'YouTube requires a video file'
          })
          continue
        }

        // YouTube 업로드
        const uploadResult = await uploadToYoutube({
          buffer: Buffer.from(await mediaFile.arrayBuffer()),
          fileName: mediaFile.name,
          title: title || mainCaption || 'Untitled Video',
          description: description || mainCaption || '',
          privacy: privacy || 'public',
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accountId
        })

        if (uploadResult.success) {
          // 성공 기록
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'success',
              platform_post_id: uploadResult.videoId,
              platform_url: `https://www.youtube.com/watch?v=${uploadResult.videoId}`,
              uploaded_at: new Date().toISOString()
            })

          hasSuccess = true
          uploadResults.push({
            accountId,
            accountName: account.account_name,
            platform: 'YouTube',
            success: true,
            url: `https://www.youtube.com/watch?v=${uploadResult.videoId}`
          })
        } else {
          // 실패 기록
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'failed',
              error_message: uploadResult.error
            })

          uploadResults.push({
            accountId,
            accountName: account.account_name,
            platform: 'YouTube',
            success: false,
            error: uploadResult.error
          })
        }
      } else if (account.platform.toLowerCase() === 'twitter') {
        // Twitter 업로드 - 해시태그 포함
        let twitterContent = mainCaption || description || title || ''
        if (twitterHashtags.trim()) {
          twitterContent += ' ' + twitterHashtags.trim()
        }

        // OAuth 1.0a 토큰으로 새로운 Twitter API 사용
        const twitterFormData = new FormData()
        twitterFormData.append('content', twitterContent)
        twitterFormData.append('accountId', accountId.toString())
        twitterFormData.append('userId', userId)
        if (mediaFile) {
          twitterFormData.append('media', mediaFile)
        }

        const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload/twitter`, {
          method: 'POST',
          body: twitterFormData
        })

        const uploadResult = await uploadResponse.json()

        if (uploadResult.success && 'tweetId' in uploadResult) {
          // 성공 기록
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'success',
              platform_post_id: uploadResult.tweetId,
              platform_url: `https://twitter.com/${account.username}/status/${uploadResult.tweetId}`,
              uploaded_at: new Date().toISOString()
            })

          hasSuccess = true
          uploadResults.push({
            accountId,
            accountName: account.account_name,
            platform: 'Twitter',
            success: true,
            url: `https://twitter.com/${account.username}/status/${uploadResult.tweetId}`
          })
        } else {
          // 실패 기록
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'failed',
              error_message: uploadResult.success ? 'Unknown error' : uploadResult.error || 'Unknown error'
            })

          uploadResults.push({
            accountId,
            accountName: account.account_name,
            platform: 'Twitter',
            success: false,
            error: uploadResult.success ? 'Unknown error' : uploadResult.error || 'Unknown error'
          })
        }
      } else {
        // 다른 플랫폼은 아직 미구현
        await supabase
          .from('post_accounts')
          .insert({
            post_id: post.id,
            account_id: accountId,
            upload_status: 'failed',
            error_message: '지원되지 않는 플랫폼'
          })

        uploadResults.push({
          accountId,
          accountName: account.account_name,
          platform: account.platform,
          success: false,
          error: '지원되지 않는 플랫폼'
        })
      }
    }

    // 전체 게시물 상태 업데이트
    const finalStatus = hasSuccess ? 'posted' : 'failed'
    await supabase
      .from('posts')
      .update({ 
        status: finalStatus,
        posted_at: hasSuccess ? new Date().toISOString() : null
      })
      .eq('id', post.id)

    return NextResponse.json({
      success: true,
      postId: post.id,
      results: uploadResults
    })

  } catch (error) {
    console.error('Multi upload error:', error)
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
      return { success: false, error: 'Token refresh failed' }
    }

    // DB 업데이트
    await supabase
      .from('connected_accounts')
      .update({
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000)
      })
      .eq('id', accountId)

    return { success: true, accessToken: tokens.access_token }
  } catch (error) {
    return { success: false, error: 'Token refresh failed' }
  }
}


async function uploadToYoutube({
  buffer,
  fileName,
  title,
  description,
  privacy,
  accessToken,
  refreshToken,
  accountId
}: {
  buffer: Buffer
  fileName: string
  title: string
  description: string
  privacy: 'public' | 'unlisted' | 'private'
  accessToken: string
  refreshToken?: string
  accountId: number
}) {
  try {
    // 토큰 만료 확인 및 갱신
    let currentToken = accessToken

    const metadata = {
      snippet: {
        title,
        description,
        tags: [],
        categoryId: '22',
        defaultLanguage: 'ko',
        defaultAudioLanguage: 'ko'
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false
      }
    }

    // Step 1: Resumable upload session 시작
    const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': buffer.length.toString(),
        'X-Upload-Content-Type': 'video/*'
      },
      body: JSON.stringify(metadata)
    })

    // 토큰이 만료된 경우 갱신 시도
    if (initResponse.status === 401 && refreshToken) {
      console.log('Token expired, refreshing...')
      const refreshResult = await refreshAccessToken(refreshToken, accountId)
      if (refreshResult.success) {
        currentToken = refreshResult.accessToken
        
        // 새 토큰으로 다시 시도
        const retryResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': buffer.length.toString(),
            'X-Upload-Content-Type': 'video/*'
          },
          body: JSON.stringify(metadata)
        })

        if (!retryResponse.ok) {
          const error = await retryResponse.text()
          console.error('YouTube upload retry failed:', error)
          return { success: false, error: 'Authentication failed after token refresh' }
        }

        const uploadUrl = retryResponse.headers.get('location')
        if (!uploadUrl) {
          return { success: false, error: 'No upload URL received' }
        }

        // 파일 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'video/*' },
          body: new Uint8Array(buffer)
        })

        if (!uploadResponse.ok) {
          return { success: false, error: 'File upload failed' }
        }

        const result = await uploadResponse.json()
        return { success: true, videoId: result.id, title: result.snippet.title }
      } else {
        return { success: false, error: 'Token refresh failed' }
      }
    }

    if (!initResponse.ok) {
      const error = await initResponse.text()
      console.error('YouTube upload init failed:', error)
      return { success: false, error: 'Upload initialization failed' }
    }

    const uploadUrl = initResponse.headers.get('location')
    if (!uploadUrl) {
      return { success: false, error: 'No upload URL received' }
    }

    // Step 2: 실제 파일 업로드
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/*' },
      body: new Uint8Array(buffer)
    })

    if (!uploadResponse.ok) {
      return { success: false, error: 'File upload failed' }
    }

    const result = await uploadResponse.json()
    return { success: true, videoId: result.id, title: result.snippet.title }

  } catch (error) {
    console.error('YouTube upload error:', error)
    return { success: false, error: 'Upload failed' }
  }
}