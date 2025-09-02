import { Job } from 'bull'
import { supabase } from '../supabase'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'

/**
 * 예약된 게시물 처리를 위한 작업 데이터 인터페이스
 */
export interface ScheduledPostJobData {
  postId: number        // 게시물 ID
  userId: number        // 사용자 ID
  accountIds: number[]  // 업로드할 계정 ID 목록
  platformSettings: any // 플랫폼별 게시 설정
  fileData?: {
    buffer: string      // base64 인코딩된 파일 데이터
    fileName: string    // 파일명
    fileSize: number    // 파일 크기
  }
}

/**
 * 예약된 게시물을 실제로 처리하는 함수
 * @param job Bull 큐에서 전달된 작업 객체
 * @returns 처리 결과 정보
 */
export async function processScheduledPost(job: Job<ScheduledPostJobData>) {
  const { postId, userId, accountIds, platformSettings, fileData } = job.data
  
  try {
    console.log(`🚀 게시물 ${postId} 처리 시작`)
    
    // 1. 게시물 상태를 '게시 중'으로 변경
    await supabase
      .from('posts')
      .update({ status: 'posting' })
      .eq('id', postId)

    // 2. 각 계정별로 업로드 처리
    const results = []
    
    for (const accountId of accountIds) {
      try {
        // 계정 정보 가져오기
        const { data: account, error: accountError } = await supabase
          .from('connected_accounts')
          .select('*')
          .eq('id', accountId)
          .single()

        if (accountError || !account) {
          throw new Error(`계정 ${accountId}를 찾을 수 없습니다`)
        }

        // post_accounts 상태를 '업로드 중'으로 변경
        await supabase
          .from('post_accounts')
          .update({ upload_status: 'uploading' })
          .eq('post_id', postId)
          .eq('account_id', accountId)

        // 플랫폼별 업로드 처리 - 현재는 YouTube만 지원
        console.log('🔍 플랫폼 확인:', {
          platform: account.platform,
          파일존재: !!fileData,
          버퍼존재: !!fileData?.buffer,
          유튜브여부: account.platform.toLowerCase() === 'youtube'
        })
        
        if (account.platform.toLowerCase() === 'youtube' && fileData && fileData.buffer) {
          console.log('🔍 YouTube 업로드 시작...')
          
          // base64 문자열을 Buffer로 복원
          const actualFileData = {
            buffer: Buffer.from(fileData.buffer, 'base64'),
            fileName: fileData.fileName,
            fileSize: fileData.fileSize
          }
          
          // YouTube에 업로드 실행
          const result = await uploadToYouTube({
            account,
            fileData: actualFileData,
            settings: platformSettings.youtube || {},
          })

          // 업로드 결과 처리
          if (result.success) {
            // 성공 시 결과 저장
            const koreanUploadTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
            
            await supabase
              .from('post_accounts')
              .update({
                upload_status: 'success',
                platform_post_id: result.videoId,
                platform_url: result.videoUrl,
                uploaded_at: koreanUploadTime,
              })
              .eq('post_id', postId)
              .eq('account_id', accountId)

            results.push({ accountId, success: true, url: result.videoUrl })
          } else {
            // 안전하게 에러 메시지 추출
            let errorMessage = 'YouTube 업로드 실패 - 알 수 없는 오류'
            
            try {
              const errorObj = (result as any).error
              if (errorObj) {
                if (typeof errorObj === 'string') {
                  errorMessage = errorObj
                } else if (errorObj.message) {
                  errorMessage = errorObj.message
                } else {
                  errorMessage = 'YouTube 업로드 실패 - ' + JSON.stringify(errorObj)
                }
              }
            } catch (e) {
              errorMessage = 'YouTube 업로드 실패 - 오류 파싱 실패'
            }
            
            console.error(`계정 ${accountId}의 YouTube 업로드 실패:`, errorMessage)
            throw new Error(errorMessage)
          }
        } else if (account.platform.toLowerCase() === 'youtube') {
          throw new Error('YouTube 업로드 실패 - 파일 데이터 또는 버퍼가 없음')
        } else if (account.platform.toLowerCase() === 'twitter') {
          console.log('🔍 Twitter 업로드 시작...')
          
          // 게시물 내용 가져오기
          const { data: post } = await supabase
            .from('posts')
            .select('content')
            .eq('id', postId)
            .single()

          // Twitter 업로드 실행
          const result = await uploadToTwitter({
            account,
            fileData: fileData ? {
              buffer: Buffer.from(fileData.buffer, 'base64'),
              fileName: fileData.fileName,
              fileSize: fileData.fileSize
            } : null,
            settings: {
              content: post?.content || '',
              ...platformSettings.twitter
            },
          })

          // 업로드 결과 처리
          if (result.success) {
            const koreanUploadTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
            
            await supabase
              .from('post_accounts')
              .update({
                upload_status: 'success',
                platform_post_id: result.tweetId,
                platform_url: result.tweetUrl,
                uploaded_at: koreanUploadTime,
              })
              .eq('post_id', postId)
              .eq('account_id', accountId)

            results.push({ accountId, success: true, url: result.tweetUrl })
          } else {
            let errorMessage = 'Twitter 업로드 실패 - 알 수 없는 오류'
            
            try {
              const errorObj = (result as any).error
              if (errorObj) {
                if (typeof errorObj === 'string') {
                  errorMessage = errorObj
                } else if (errorObj.message) {
                  errorMessage = errorObj.message
                } else {
                  errorMessage = 'Twitter 업로드 실패 - ' + JSON.stringify(errorObj)
                }
              }
            } catch (e) {
              errorMessage = 'Twitter 업로드 실패 - 오류 파싱 실패'
            }
            
            console.error(`계정 ${accountId}의 Twitter 업로드 실패:`, errorMessage)
            throw new Error(errorMessage)
          }
        } else if (account.platform.toLowerCase() === 'instagram') {
          console.log('📸 Instagram 업로드 시작...')
          
          // 게시물 내용 가져오기
          const { data: post } = await supabase
            .from('posts')
            .select('content, media_url')
            .eq('id', postId)
            .single()

          // Instagram 업로드 실행
          const result = await uploadToInstagram({
            account,
            fileData: fileData ? {
              buffer: Buffer.from(fileData.buffer, 'base64'),
              fileName: fileData.fileName,
              fileSize: fileData.fileSize
            } : null,
            settings: {
              content: post?.content || '',
              mediaUrl: post?.media_url,
              ...platformSettings.instagram
            },
          })

          // 업로드 결과 처리
          if (result.success) {
            const koreanUploadTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
            
            await supabase
              .from('post_accounts')
              .update({
                upload_status: 'success',
                platform_post_id: result.postId,
                platform_url: result.postUrl,
                uploaded_at: koreanUploadTime,
              })
              .eq('post_id', postId)
              .eq('account_id', accountId)

            results.push({ accountId, success: true, url: result.postUrl })
          } else {
            let errorMessage = 'Instagram 업로드 실패 - 알 수 없는 오류'
            
            try {
              const errorObj = (result as any).error
              if (errorObj) {
                if (typeof errorObj === 'string') {
                  errorMessage = errorObj
                } else if (errorObj.message) {
                  errorMessage = errorObj.message
                } else {
                  errorMessage = 'Instagram 업로드 실패 - ' + JSON.stringify(errorObj)
                }
              }
            } catch (e) {
              errorMessage = 'Instagram 업로드 실패 - 오류 파싱 실패'
            }
            
            console.error(`계정 ${accountId}의 Instagram 업로드 실패:`, errorMessage)
            throw new Error(errorMessage)
          }
        } else {
          throw new Error(`플랫폼 ${account.platform}은 아직 지원되지 않습니다`)
        }

      } catch (error) {
        // 계정별 업로드 실패 처리
        console.error(`❌ 계정 ${accountId} 업로드 실패:`, error)
        
        await supabase
          .from('post_accounts')
          .update({
            upload_status: 'failed',
            error_message: error instanceof Error ? error.message : '알 수 없는 오류',
          })
          .eq('post_id', postId)
          .eq('account_id', accountId)

        const errorMsg = error instanceof Error ? error.message : String(error || '알 수 없는 오류')
        results.push({ accountId, success: false, error: errorMsg })
      }
    }

    // 3. 전체 결과에 따라 게시물 상태 업데이트
    const successCount = results.filter(r => r.success).length
    const finalStatus = successCount > 0 ? 'posted' : 'failed'

    const koreanTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
    
    await supabase
      .from('posts')
      .update({
        status: finalStatus,
        posted_at: successCount > 0 ? koreanTime : null,
        updated_at: koreanTime,
        platform_results: results,
      })
      .eq('id', postId)

    console.log(`✅ 게시물 ${postId} 처리 완료: ${successCount}/${accountIds.length}개 계정 성공`)
    
    return {
      success: true,
      results,
      successCount,
      totalCount: accountIds.length,
    }

  } catch (error) {
    console.error(`❌ 게시물 ${postId} 처리 실패:`, error)
    
    // 전체 실패 시 상태 업데이트
    await supabase
      .from('posts')
      .update({ status: 'failed' })
      .eq('id', postId)

    throw error
  }
}

/**
 * YouTube에 동영상 업로드하는 함수
 * @param account 연결된 YouTube 계정 정보
 * @param fileData 업로드할 파일 데이터
 * @param settings 동영상 제목, 설명, 공개 범위 등의 설정
 * @returns 업로드 결과
 */
async function uploadToYouTube({
  account,
  fileData,
  settings
}: {
  account: any
  fileData: { buffer: Buffer; fileName: string; fileSize: number }
  settings: { title: string; description: string; privacy: string }
}) {
  try {
    // 1. 필수 데이터 검증
    if (!fileData || !fileData.buffer) {
      throw new Error('파일 데이터 또는 버퍼가 없습니다')
    }
    
    if (!Buffer.isBuffer(fileData.buffer)) {
      throw new Error('파일 버퍼가 유효한 Buffer 객체가 아닙니다')
    }
    
    if (!fileData.buffer.length) {
      throw new Error('파일 버퍼가 비어 있습니다')
    }
    
    if (!account.access_token) {
      throw new Error('YouTube 액세스 토큰이 없습니다')
    }

    // 2. Access token 갱신 함수 정의
    const refreshAccessToken = async () => {
      if (!account.refresh_token) {
        throw new Error('리프레시 토큰이 없습니다 - YouTube 계정 재연결 필요')
      }

      console.log('🔄 YouTube 액세스 토큰 갱신 중...')
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new Error('액세스 토큰 갱신 실패 - YouTube 계정 재연결 필요')
      }

      const tokenData = await response.json()
      
      // DB에 새 토큰 저장
      await supabase
        .from('connected_accounts')
        .update({ 
          access_token: tokenData.access_token,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)

      account.access_token = tokenData.access_token
      console.log('✅ 액세스 토큰 갱신 성공')
    }

    // 3. 업로드 시작 준비
    console.log('🔍 YouTube 업로드 준비:', {
      버퍼타입: typeof fileData.buffer,
      버퍼생성자: fileData.buffer?.constructor?.name,
      버퍼크기: fileData.buffer?.length,
      파일명: fileData.fileName,
      토큰존재: !!account.access_token,
      버퍼유효성: Buffer.isBuffer(fileData.buffer)
    })

    // 4. 동영상 메타데이터 설정
    const metadata = {
      snippet: {
        title: settings.title || '제목 없는 동영상',
        description: settings.description || '',
        tags: [],
        categoryId: '22', // 카테고리 ID: 사람 및 블로그
        defaultLanguage: 'ko',
        defaultAudioLanguage: 'ko'
      },
      status: {
        privacyStatus: settings.privacy || 'public', // 공개 설정: public, unlisted, private
        selfDeclaredMadeForKids: false
      }
    }

    // 5. 업로드 세션 초기화 (토큰 갱신 재시도 포함)
    let initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': fileData.buffer.length.toString(),
        'X-Upload-Content-Type': 'video/*'
      },
      body: JSON.stringify(metadata)
    })

    // 6. 401 에러 시 토큰 갱신 후 재시도
    if (initResponse.status === 401) {
      console.log('🔄 액세스 토큰 만료, 갱신 중...')
      await refreshAccessToken()
      
      // 새 토큰으로 재시도
      initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': fileData.buffer.length.toString(),
          'X-Upload-Content-Type': 'video/*'
        },
        body: JSON.stringify(metadata)
      })
    }

    // 7. 초기화 응답 확인
    if (!initResponse.ok) {
      const errorText = await initResponse.text()
      console.error('🚨 YouTube API 초기화 실패:', {
        상태코드: initResponse.status,
        상태메시지: initResponse.statusText,
        오류내용: errorText
      })
      throw new Error(`업로드 초기화 실패: ${initResponse.status} ${errorText}`)
    }

    // 8. 업로드 URL 추출
    const uploadUrl = initResponse.headers.get('location')
    if (!uploadUrl) {
      throw new Error('업로드 URL을 받지 못했습니다')
    }

    // 9. 실제 파일 데이터 업로드
    console.log('📤 파일 데이터 업로드 중...')
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*'
      },
      body: new Uint8Array(fileData.buffer)
    })

    // 10. 업로드 결과 확인
    if (!uploadResponse.ok) {
      throw new Error('파일 업로드 실패')
    }

    const result = await uploadResponse.json()
    console.log('✅ 동영상 업로드 성공:', result.id)
    
    // 11. 성공 결과 반환
    return { 
      success: true, 
      videoId: result.id,
      videoUrl: `https://www.youtube.com/watch?v=${result.id}`
    }

  } catch (error) {
    // 12. 오류 발생 시 실패 결과 반환
    console.error('❌ YouTube 업로드 실패:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '업로드 실패' 
    }
  }
}

/**
 * Twitter에 게시물 업로드하는 함수
 */
async function uploadToTwitter({
  account,
  fileData,
  settings
}: {
  account: any
  fileData: { buffer: Buffer; fileName: string; fileSize: number } | null
  settings: { content?: string; hashtags?: string }
}) {
  try {
    // OAuth 설정
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
      secret: account.access_token_secret
    }

    // 미디어가 있는 경우 먼저 업로드
    let mediaIds: string[] = []
    if (fileData) {
      const mediaId = await uploadMediaToTwitter(fileData, oauth, token)
      if (mediaId) {
        mediaIds.push(mediaId)
      }
    }

    // 트윗 데이터 생성
    const tweetData: any = {
      text: settings.content || ''
    }

    if (mediaIds.length > 0) {
      tweetData.media = {
        media_ids: mediaIds
      }
    }

    // 트윗 게시
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
      return {
        success: true,
        tweetId: result.data.id,
        tweetUrl: `https://twitter.com/${account.username}/status/${result.data.id}`
      }
    } else {
      return {
        success: false,
        error: result.errors?.[0]?.message || 'Twitter 업로드에 실패했습니다'
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Twitter 업로드 실패'
    }
  }
}

/**
 * Twitter에 미디어 파일 업로드
 */
async function uploadMediaToTwitter(
  fileData: { buffer: Buffer; fileName: string; fileSize: number },
  oauth: any,
  token: any
): Promise<string | null> {
  try {
    const { buffer, fileName } = fileData
    
    // 파일 타입 확인
    const isVideo = fileName.toLowerCase().includes('.mp4') || fileName.toLowerCase().includes('.mov')
    const mediaType = isVideo ? 'video/mp4' : 'image/jpeg'
    const mediaCategory = isVideo ? 'tweet_video' : 'tweet_image'

    if (isVideo) {
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
  try {
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
  } catch (error) {
    console.error('이미지 업로드 실패:', error)
    return null
  }
}

/**
 * 동영상 업로드 (Chunked Upload) - 간소화 버전
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
      headers: { ...initAuthHeader },
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
        headers: { ...appendAuthHeader },
        body: appendFormData
      })

      if (!appendResponse.ok) {
        throw new Error(`청크 업로드 실패 (${segmentIndex})`)
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
      headers: { ...finalizeAuthHeader },
      body: finalizeFormData
    })

    const finalizeResult = await finalizeResponse.json()
    
    if (!finalizeResponse.ok) {
      throw new Error(`동영상 업로드 완료 처리 실패: ${JSON.stringify(finalizeResult)}`)
    }

    // 동영상 처리 대기 (간소화)
    if (finalizeResult.processing_info && finalizeResult.processing_info.state === 'pending') {
      // 간단한 대기 로직
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    return mediaId

  } catch (error) {
    console.error('동영상 업로드 실패:', error)
    return null
  }
}

/**
 * Instagram에 게시물 업로드하는 함수
 */
async function uploadToInstagram({
  account,
  fileData,
  settings
}: {
  account: any
  fileData: { buffer: Buffer; fileName: string; fileSize: number } | null
  settings: { content?: string; mediaUrl?: string }
}) {
  try {
    // Instagram은 미디어 파일이 필수
    if (!fileData && !settings.mediaUrl) {
      return {
        success: false,
        error: 'Instagram 업로드에는 미디어 파일이 필요합니다'
      }
    }

    // 미디어 URL 결정 (예약 게시물의 경우 이미 Cloudinary에 업로드됨)
    let mediaUrl: string | undefined = settings.mediaUrl
    
    // 파일 데이터가 있고 mediaUrl이 없다면 Cloudinary에 업로드
    if (!mediaUrl && fileData) {
      const uploadedUrl = await uploadToCloudinary(fileData)
      if (!uploadedUrl) {
        return {
          success: false,
          error: '미디어 파일 업로드에 실패했습니다'
        }
      }
      mediaUrl = uploadedUrl
    }

    // 미디어 타입 확인
    const isVideo = fileData?.fileName?.toLowerCase().includes('.mp4') || 
                   fileData?.fileName?.toLowerCase().includes('.mov') || 
                   mediaUrl?.includes('video')

    // Instagram API 컨테이너 생성
    const mediaParams = isVideo ? {
      media_type: 'VIDEO',
      video_url: mediaUrl,
      caption: settings.content || '',
      access_token: account.access_token,
      thumb_offset: '0'  // 썸네일 시간(초)
    } : {
      image_url: mediaUrl,
      caption: settings.content || '',
      access_token: account.access_token
    }

    const containerResponse = await fetch(`https://graph.instagram.com/v21.0/${account.account_id}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaParams)
    })

    const containerData = await containerResponse.json()

    if (!containerResponse.ok) {
      return {
        success: false,
        error: containerData.error?.message || 'Instagram 컨테이너 생성 실패'
      }
    }

    // 동영상인 경우 처리 대기
    if (isVideo) {
      console.log('⏳ 동영상 처리 대기 중...')
      await new Promise(resolve => setTimeout(resolve, 10000)) // 10초 대기
      
      // 컨테이너 상태 확인
      const statusResponse = await fetch(`https://graph.instagram.com/v21.0/${containerData.id}?fields=status_code&access_token=${account.access_token}`)
      const statusData = await statusResponse.json()
      
      console.log('📹 동영상 처리 상태:', statusData)
      
      if (statusData.status_code === 'ERROR') {
        return {
          success: false,
          error: '동영상 처리 중 오류가 발생했습니다'
        }
      }
    }

    // 게시 실행
    const publishResponse = await fetch(`https://graph.instagram.com/v21.0/${account.account_id}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: account.access_token
      })
    })

    const publishData = await publishResponse.json()

    if (publishResponse.ok && publishData.id) {
      return {
        success: true,
        postId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}`
      }
    } else {
      return {
        success: false,
        error: publishData.error?.message || 'Instagram 게시 실패'
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Instagram 업로드 실패'
    }
  }
}

/**
 * Cloudinary에 미디어 파일 업로드
 */
async function uploadToCloudinary(fileData: { buffer: Buffer; fileName: string; fileSize: number }): Promise<string | null> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.log('⚠️ Cloudinary 환경변수가 설정되지 않음')
      return null
    }

    const { v2: cloudinary } = await import('cloudinary')
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    })

    const base64Data = `data:image/jpeg;base64,${fileData.buffer.toString('base64')}`
    const isVideo = fileData.fileName.toLowerCase().includes('.mp4') || fileData.fileName.toLowerCase().includes('.mov')

    const uploadOptions = {
      folder: 'social_media_manager',
      public_id: `scheduled_${Date.now()}`,
      resource_type: isVideo ? 'video' : 'image' as 'video' | 'image'
    }

    const result = await cloudinary.uploader.upload(base64Data, uploadOptions)
    return result.secure_url

  } catch (error) {
    console.error('❌ Cloudinary 업로드 실패:', error)
    return null
  }
}