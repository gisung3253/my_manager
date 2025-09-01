import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'

/**
 * Twitter 업로드 API
 * POST /api/upload/twitter
 * 
 * 텍스트, 이미지, 동영상을 Twitter에 업로드합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 폼 데이터 파싱
    const formData = await request.formData()
    const content = formData.get('content') as string
    const accountId = formData.get('accountId') as string
    const userId = formData.get('userId') as string
    const mediaFile = formData.get('media') as File | null

    // 2. 필수 필드 검증
    if (!content || !accountId || !userId) {
      return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다' }, { status: 400 })
    }

    // 3. 계정 정보 가져오기
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', parseInt(accountId))
      .eq('user_id', parseInt(userId))
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: '계정을 찾을 수 없습니다' }, { status: 404 })
    }


    const oauth = new OAuth({
      consumer: {
        key: process.env.TWITTER_API_KEY!,
        secret: process.env.TWITTER_API_SECRET!
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64')
      }
    })

    const token = {
      key: account.access_token,
      secret: account.access_token_secret // Twitter는 access_token_secret도 필요
    }

    // 토큰 유효성 검사
    if (!token.key || !token.secret) {
      return NextResponse.json({ 
        error: 'Twitter 토큰이 유효하지 않습니다. 계정을 다시 연결해주세요.' 
      }, { status: 400 })
    }

    // 5. 미디어가 있는 경우 먼저 업로드
    let mediaIds: string[] = []
    if (mediaFile) {
      const mediaId = await uploadMediaToTwitter(mediaFile, oauth, token)
      if (mediaId) {
        mediaIds.push(mediaId)
      }
    }

    // 6. 트윗 생성
    const tweetData: any = {
      text: content
    }

    if (mediaIds.length > 0) {
      tweetData.media = {
        media_ids: mediaIds
      }
    }

    const requestData = {
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST'
    }

    const authData = oauth.authorize(requestData, token)
    const authHeader = oauth.toHeader(authData)

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tweetData)
    })

    const result = await response.json()

    if (response.ok && result.data) {
      return NextResponse.json({
        success: true,
        tweetId: result.data.id,
        tweetUrl: `https://twitter.com/${account.username}/status/${result.data.id}`
      })
    } else {
      console.error('Twitter API 오류:', result)
      return NextResponse.json({
        success: false,
        error: result.errors?.[0]?.message || 'Twitter 업로드에 실패했습니다'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Twitter 업로드 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다'
    }, { status: 500 })
  }
}

/**
 * Twitter에 미디어 파일 업로드
 */
async function uploadMediaToTwitter(
  file: File, 
  oauth: any, 
  token: any
): Promise<string | null> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 파일 크기 체크 (Twitter 제한)
    const maxSize = file.type.startsWith('video/') ? 512 * 1024 * 1024 : 5 * 1024 * 1024 // 동영상 512MB, 이미지 5MB
    if (buffer.length > maxSize) {
      throw new Error('파일 크기가 너무 큽니다')
    }

    // 파일 타입 확인
    const mediaType = file.type.startsWith('video/') ? 'video/mp4' : 'image/jpeg'
    const mediaCategory = file.type.startsWith('video/') ? 'tweet_video' : 'tweet_image'

    if (file.type.startsWith('video/')) {
      // 동영상은 chunked upload 사용
      return await uploadVideoChunked(buffer, mediaType, mediaCategory, oauth, token)
    } else {
      // 이미지는 simple upload 사용
      return await uploadImageSimple(buffer, mediaType, oauth, token)
    }

  } catch (error) {
    console.error('미디어 업로드 오류:', error)
    return null
  }
}

/**
 * 이미지 업로드 (Simple Upload)
 */
async function uploadImageSimple(
  buffer: Buffer,
  mediaType: string,
  oauth: any,
  token: any
): Promise<string | null> {
  const requestData = {
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    method: 'POST'
  }

  const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

  const formData = new FormData()
  formData.append('media', new Blob([new Uint8Array(buffer)], { type: mediaType }))

  const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      ...authHeader
    },
    body: formData
  })

  const result = await response.json()

  if (response.ok && result.media_id_string) {
    return result.media_id_string
  }

  throw new Error(result.errors?.[0]?.message || '이미지 업로드 실패')
}

/**
 * 동영상 업로드 (Chunked Upload)
 */
async function uploadVideoChunked(
  buffer: Buffer,
  mediaType: string,
  mediaCategory: string,
  oauth: any,
  token: any
): Promise<string | null> {
  try {
    // INIT
    const initData = {
      command: 'INIT',
      total_bytes: buffer.length,
      media_type: mediaType,
      media_category: mediaCategory
    }

    const initRequestData = {
      url: 'https://upload.twitter.com/1.1/media/upload.json',
      method: 'POST'
    }

    const initAuthHeader = oauth.toHeader(oauth.authorize(initRequestData, token))
    const initFormData = new FormData()
    Object.entries(initData).forEach(([key, value]) => {
      initFormData.append(key, value.toString())
    })

    const initResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        ...initAuthHeader
      },
      body: initFormData
    })

    const initResult = await initResponse.json()

    if (!initResponse.ok) {
      throw new Error(`동영상 업로드 초기화 실패: ${JSON.stringify(initResult)}`)
    }

    const mediaId = initResult.media_id_string

    // APPEND (chunks)
    const chunkSize = 5 * 1024 * 1024 // 5MB chunks
    let segmentIndex = 0

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize)
      
      const appendRequestData = {
        url: 'https://upload.twitter.com/1.1/media/upload.json',
        method: 'POST'
      }

      const appendAuthHeader = oauth.toHeader(oauth.authorize(appendRequestData, token))
      const appendFormData = new FormData()
      appendFormData.append('command', 'APPEND')
      appendFormData.append('media_id', mediaId)
      appendFormData.append('segment_index', segmentIndex.toString())
      appendFormData.append('media', new Blob([new Uint8Array(chunk)]))

      const appendResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          ...appendAuthHeader
        },
        body: appendFormData
      })

      if (!appendResponse.ok) {
        const appendError = await appendResponse.text()
        throw new Error(`청크 업로드 실패 (${segmentIndex}): ${appendError}`)
      }

      segmentIndex++
    }

    // FINALIZE
    const finalizeRequestData = {
      url: 'https://upload.twitter.com/1.1/media/upload.json',
      method: 'POST'
    }

    const finalizeAuthHeader = oauth.toHeader(oauth.authorize(finalizeRequestData, token))
    const finalizeFormData = new FormData()
    finalizeFormData.append('command', 'FINALIZE')
    finalizeFormData.append('media_id', mediaId)

    const finalizeResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        ...finalizeAuthHeader
      },
      body: finalizeFormData
    })

    const finalizeResult = await finalizeResponse.json()
    
    if (!finalizeResponse.ok) {
      throw new Error(`동영상 업로드 완료 처리 실패: ${JSON.stringify(finalizeResult)}`)
    }

    // STATUS 확인 단계 (동영상 처리 상태 체크)
    if (finalizeResult.processing_info) {
      let processingComplete = false
      let attempts = 0
      const maxAttempts = 30 // 최대 30번 시도 (약 5분)

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, finalizeResult.processing_info.check_after_secs * 1000 || 10000))
        
        const statusRequestData = {
          url: `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`,
          method: 'GET'
        }

        const statusAuthHeader = oauth.toHeader(oauth.authorize(statusRequestData, token))
        
        const statusResponse = await fetch(statusRequestData.url, {
          method: 'GET',
          headers: {
            ...statusAuthHeader
          }
        })

        const statusResult = await statusResponse.json()

        if (statusResult.processing_info) {
          if (statusResult.processing_info.state === 'succeeded') {
            processingComplete = true
          } else if (statusResult.processing_info.state === 'failed') {
            throw new Error(`동영상 처리 실패: ${statusResult.processing_info.error?.message || '알 수 없는 오류'}`)
          }
          // in_progress인 경우 계속 대기
        } else {
          // processing_info가 없으면 처리 완료로 간주
          processingComplete = true
        }

        attempts++
      }

      if (!processingComplete) {
        throw new Error('동영상 처리 시간 초과')
      }
    }
    
    return mediaId

  } catch (error) {
    console.error('동영상 업로드 실패:', error)
    return null
  }
}