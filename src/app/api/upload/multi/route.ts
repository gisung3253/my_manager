import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 여러 소셜 미디어 플랫폼에 동시 업로드하는 API
 * POST /api/upload/multi
 * 
 * 하나의 콘텐츠를 여러 계정(YouTube, Twitter 등)에 동시에 업로드합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 폼 데이터 파싱
    const formData = await request.formData()
    const mediaFile = formData.get('video') as File | null // 비디오 또는 이미지 파일 (선택적)
    const selectedAccountsStr = formData.get('selectedAccounts') as string // 선택된 계정 ID 목록
    const title = formData.get('title') as string // 제목 (YouTube용)
    const description = formData.get('description') as string // 설명 (YouTube용)
    const privacy = formData.get('privacy') as 'public' | 'unlisted' | 'private' // 공개 설정 (YouTube용)
    const userId = formData.get('userId') as string // 사용자 ID
    const mainCaption = formData.get('mainCaption') as string // 주요 텍스트 내용
    const postType = formData.get('postType') as string || 'text' // 게시물 유형 (text, video 등)
    const twitterHashtags = formData.get('twitterHashtags') as string || '' // Twitter 해시태그

    // 2. 필수 필드 검증
    if (!selectedAccountsStr || !userId || !mainCaption?.trim()) {
      return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다' }, { status: 400 })
    }

    const selectedAccounts = JSON.parse(selectedAccountsStr)

    // 3. 게시물 기본 정보를 DB에 저장
    const koreanTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
    
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: parseInt(userId),
        title: title || mainCaption.substring(0, 50) || '제목 없음',
        content: mainCaption || description || '',
        post_type: postType,
        status: 'posting', // 업로드 중 상태로 시작
        file_name: mediaFile?.name || null,
        platform_settings: { youtube: { privacy } },
        created_at: koreanTime,
        updated_at: koreanTime
      })
      .select()
      .single()

    if (postError || !post) {
      console.error('게시물 생성 실패:', postError)
      return NextResponse.json({ error: '게시물 생성에 실패했습니다' }, { status: 500 })
    }

    // 4. 각 계정별 업로드 처리
    const uploadResults = []
    let hasSuccess = false

    for (const accountId of selectedAccounts) {
      // 4-1. 계정 정보 가져오기
      const { data: account, error: accountError } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', parseInt(userId))
        .single()

      if (accountError || !account) {
        // 계정을 찾을 수 없는 경우 실패 기록
        await supabase
          .from('post_accounts')
          .insert({
            post_id: post.id,
            account_id: accountId,
            upload_status: 'failed',
            error_message: '계정을 찾을 수 없습니다'
          })
        
        uploadResults.push({
          accountId,
          success: false,
          error: '계정을 찾을 수 없습니다'
        })
        
        continue
      }

      // 4-2. 플랫폼별 업로드 처리
      if (account.platform.toLowerCase() === 'youtube') {
        // YouTube 업로드 처리
        if (!mediaFile) {
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'failed',
              error_message: 'YouTube 업로드에는 비디오 파일이 필요합니다'
            })

          uploadResults.push({
            accountId,
            accountName: account.account_name,
            platform: 'YouTube',
            success: false,
            error: 'YouTube 업로드에는 비디오 파일이 필요합니다'
          })
          continue
        }

        // YouTube API로 동영상 업로드
        const uploadResult = await uploadToYoutube({
          buffer: Buffer.from(await mediaFile.arrayBuffer()),
          fileName: mediaFile.name,
          title: title || mainCaption || '제목 없음',
          description: description || mainCaption || '',
          privacy: privacy || 'public',
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accountId
        })

        if (uploadResult.success) {
          // 성공 처리
          const koreanUploadTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
          
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'success',
              platform_post_id: uploadResult.videoId,
              platform_url: `https://www.youtube.com/watch?v=${uploadResult.videoId}`,
              uploaded_at: koreanUploadTime
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
          // 실패 처리
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
        // Twitter 업로드 처리
        let twitterContent = mainCaption || description || title || ''
        if (twitterHashtags.trim()) {
          twitterContent += ' ' + twitterHashtags.trim()
        }

        // Twitter API 호출을 위한 FormData 준비
        const twitterFormData = new FormData()
        twitterFormData.append('content', twitterContent)
        twitterFormData.append('accountId', accountId.toString())
        twitterFormData.append('userId', userId)
        if (mediaFile) {
          twitterFormData.append('media', mediaFile)
        }

        // Twitter 업로드 API 호출
        const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload/twitter`, {
          method: 'POST',
          body: twitterFormData
        })

        const uploadResult = await uploadResponse.json()

        if (uploadResult.success && 'tweetId' in uploadResult) {
          // 성공 처리
          const koreanUploadTime2 = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
          
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'success',
              platform_post_id: uploadResult.tweetId,
              platform_url: `https://twitter.com/${account.username}/status/${uploadResult.tweetId}`,
              uploaded_at: koreanUploadTime2
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
          // 실패 처리
          await supabase
            .from('post_accounts')
            .insert({
              post_id: post.id,
              account_id: accountId,
              upload_status: 'failed',
              error_message: uploadResult.error || '알 수 없는 오류'
            })

          uploadResults.push({
            accountId,
            accountName: account.account_name,
            platform: 'Twitter',
            success: false,
            error: uploadResult.error || '알 수 없는 오류'
          })
        }
      } else {
        // 지원되지 않는 플랫폼
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

    // 5. 전체 게시물 상태 업데이트
    const finalStatus = hasSuccess ? 'posted' : 'failed'
    const koreanPostedTime = hasSuccess ? new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString() : null
    
    await supabase
      .from('posts')
      .update({ 
        status: finalStatus,
        posted_at: koreanPostedTime,
        updated_at: new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
      })
      .eq('id', post.id)

    // 6. 결과 반환
    return NextResponse.json({
      success: true,
      postId: post.id,
      results: uploadResults
    })

  } catch (error) {
    console.error('다중 업로드 오류:', error)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다' }, { status: 500 })
  }
}

/**
 * YouTube 액세스 토큰 갱신 함수
 * 
 * @param refreshToken 리프레시 토큰
 * @param accountId 계정 ID
 * @returns 토큰 갱신 결과
 */
async function refreshAccessToken(refreshToken: string, accountId: number) {
  try {
    // Google OAuth API로 토큰 갱신 요청
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
      return { success: false, error: '토큰 갱신에 실패했습니다' }
    }

    // 갱신된 토큰을 DB에 저장
    await supabase
      .from('connected_accounts')
      .update({
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000)
      })
      .eq('id', accountId)

    return { success: true, accessToken: tokens.access_token }
  } catch (error) {
    return { success: false, error: '토큰 갱신에 실패했습니다' }
  }
}

/**
 * YouTube에 동영상 업로드 함수
 * 
 * @param params 업로드에 필요한 정보들
 * @returns 업로드 결과
 */
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
    // 현재 토큰 설정
    let currentToken = accessToken

    // 메타데이터 준비
    const metadata = {
      snippet: {
        title,
        description,
        tags: [],
        categoryId: '22',  // 카테고리: 사람 및 블로그
        defaultLanguage: 'ko',
        defaultAudioLanguage: 'ko'
      },
      status: {
        privacyStatus: privacy,
        selfDeclaredMadeForKids: false
      }
    }

    // 1단계: Resumable 업로드 세션 시작
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
      console.log('토큰이 만료되어 갱신 중...')
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
          console.error('YouTube 업로드 재시도 실패:', error)
          return { success: false, error: '토큰 갱신 후에도 인증에 실패했습니다' }
        }

        const uploadUrl = retryResponse.headers.get('location')
        if (!uploadUrl) {
          return { success: false, error: '업로드 URL을 받지 못했습니다' }
        }

        // 파일 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'video/*' },
          body: new Uint8Array(buffer)
        })

        if (!uploadResponse.ok) {
          return { success: false, error: '파일 업로드에 실패했습니다' }
        }

        const result = await uploadResponse.json()
        return { success: true, videoId: result.id, title: result.snippet.title }
      } else {
        return { success: false, error: '토큰 갱신에 실패했습니다' }
      }
    }

    if (!initResponse.ok) {
      const error = await initResponse.text()
      console.error('YouTube 업로드 초기화 실패:', error)
      return { success: false, error: '업로드 초기화에 실패했습니다' }
    }

    const uploadUrl = initResponse.headers.get('location')
    if (!uploadUrl) {
      return { success: false, error: '업로드 URL을 받지 못했습니다' }
    }

    // 2단계: 실제 파일 업로드
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/*' },
      body: new Uint8Array(buffer)
    })

    if (!uploadResponse.ok) {
      return { success: false, error: '파일 업로드에 실패했습니다' }
    }

    const result = await uploadResponse.json()
    return { success: true, videoId: result.id, title: result.snippet.title }

  } catch (error) {
    console.error('YouTube 업로드 오류:', error)
    return { success: false, error: '업로드에 실패했습니다' }
  }
}