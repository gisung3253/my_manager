import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * YouTube 동영상 직접 업로드 API
 * POST /api/upload/youtube
 * 
 * 사용자가 선택한 YouTube 계정으로 동영상을 직접 업로드합니다.
 * 예약 없이 즉시 업로드하는 기능입니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. FormData에서 업로드 정보 추출
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const accountId = formData.get('accountId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const privacy = formData.get('privacy') as 'public' | 'unlisted' | 'private'
    const userId = formData.get('userId') as string

    // 2. 필수 필드 검증
    if (!videoFile || !accountId || !title || !userId) {
      return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다' }, { status: 400 })
    }

    // 3. 연결된 계정 정보 가져오기
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', parseInt(accountId))
      .eq('user_id', parseInt(userId))
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: '계정을 찾을 수 없거나 접근 권한이 없습니다' }, { status: 404 })
    }

    // 4. 파일을 Buffer로 변환
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 5. 액세스 토큰 갱신 확인
    let accessToken = account.access_token
    if (account.expires_at && new Date(account.expires_at) < new Date()) {
      console.log('🔄 액세스 토큰 만료, 갱신 중...')
      const refreshResult = await refreshAccessToken(account.refresh_token, parseInt(accountId))
      if (refreshResult.success) {
        accessToken = refreshResult.accessToken
      } else {
        return NextResponse.json({ error: '액세스 토큰 갱신에 실패했습니다' }, { status: 401 })
      }
    }

    // 6. YouTube API 업로드 실행
    const uploadResponse = await uploadToYoutube({
      buffer,
      fileName: videoFile.name,
      title,
      description: description || '',
      privacy: privacy || 'public',
      accessToken
    })

    // 7. 업로드 성공 처리
    if (uploadResponse.success) {
      // 7-1. 게시물을 DB에 저장
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
        console.error('게시물 저장 실패:', postError)
      } else {
        // 7-2. post_accounts 테이블에도 기록
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
          console.error('게시물-계정 연결 저장 실패:', accountError)
        }
      }

      // 7-3. 성공 응답 반환
      return NextResponse.json({
        success: true,
        videoId: uploadResponse.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.videoId}`
      })
    } 
    // 8. 업로드 실패 처리
    else {
      // 8-1. 실패한 게시물 정보 DB에 기록
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

      // 8-2. 실패 정보 post_accounts 테이블에 기록
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

      // 8-3. 실패 응답 반환
      return NextResponse.json({ 
        error: uploadResponse.error || '업로드에 실패했습니다' 
      }, { status: 500 })
    }

  } catch (error) {
    // 9. 예상치 못한 오류 처리
    console.error('YouTube 업로드 오류:', error)
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
    // 1. Google OAuth API 호출하여 새 토큰 요청
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

    // 2. 토큰 발급 확인
    if (!tokens.access_token) {
      console.error('토큰 갱신 실패:', tokens)
      return { success: false, error: '토큰 갱신에 실패했습니다' }
    }

    // 3. 새 토큰을 DB에 저장
    const { error: updateError } = await supabase
      .from('connected_accounts')
      .update({
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000)
      })
      .eq('id', accountId)

    if (updateError) {
      console.error('DB에 토큰 업데이트 실패:', updateError)
    }

    return { success: true, accessToken: tokens.access_token }
  } catch (error) {
    console.error('토큰 갱신 오류:', error)
    return { success: false, error: '토큰 갱신에 실패했습니다' }
  }
}

/**
 * YouTube에 동영상 업로드 함수
 * 
 * YouTube Data API v3를 사용하여 동영상을 업로드합니다.
 * Resumable Upload 프로토콜을 사용합니다.
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
    // 1. 메타데이터 준비
    const metadata = {
      snippet: {
        title,                  // 동영상 제목
        description,            // 동영상 설명
        tags: [],               // 태그 (없음)
        categoryId: '22',       // 카테고리: 사람 및 블로그
        defaultLanguage: 'ko',  // 기본 언어: 한국어
        defaultAudioLanguage: 'ko' // 기본 오디오 언어: 한국어
      },
      status: {
        privacyStatus: privacy,             // 공개 설정: public(공개), unlisted(비공개 링크), private(비공개)
        selfDeclaredMadeForKids: false      // 아동용 컨텐츠 아님
      }
    }

    // 2. Resumable upload 세션 시작
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

    // 3. 초기화 응답 확인
    if (!initResponse.ok) {
      const error = await initResponse.text()
      console.error('YouTube 업로드 초기화 실패:', error)
      try {
        const errorObj = JSON.parse(error)
        console.error('YouTube 업로드 초기화 실패:', errorObj)
        return { success: false, error: errorObj.error?.message || '업로드 초기화에 실패했습니다' }
      } catch {
        console.error('YouTube 업로드 초기화 실패:', error)
        return { success: false, error: '업로드 초기화에 실패했습니다' }
      }
    }

    // 4. 업로드 URL 확인
    const uploadUrl = initResponse.headers.get('location')
    if (!uploadUrl) {
      return { success: false, error: '업로드 URL을 받지 못했습니다' }
    }

    // 5. 실제 파일 데이터 업로드
    console.log('📤 파일 데이터 업로드 중...')
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*'
      },
      body: new Uint8Array(buffer)
    })

    // 6. 업로드 결과 확인
    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      console.error('YouTube 파일 업로드 실패:', error)
      return { success: false, error: '파일 업로드에 실패했습니다' }
    }

    // 7. 업로드 성공 처리
    const result = await uploadResponse.json()
    console.log('✅ YouTube 업로드 성공:', result.id)
    return { 
      success: true, 
      videoId: result.id,
      title: result.snippet.title
    }

  } catch (error) {
    // 8. 예외 처리
    console.error('YouTube 업로드 오류:', error)
    return { success: false, error: '업로드 중 오류가 발생했습니다' }
  }
}