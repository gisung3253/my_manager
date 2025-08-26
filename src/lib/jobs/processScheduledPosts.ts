import { Job } from 'bull'
import { supabase } from '../supabase'

// 예약된 게시물 처리 Job 타입
export interface ScheduledPostJobData {
  postId: number
  userId: number
  accountIds: number[]
  platformSettings: any
  fileData?: {
    buffer: string // base64 문자열로 저장됨
    fileName: string
    fileSize: number
  }
}

// 예약된 게시물을 실제로 업로드하는 함수
export async function processScheduledPost(job: Job<ScheduledPostJobData>) {
  const { postId, userId, accountIds, platformSettings, fileData } = job.data
  
  try {
    console.log(`🚀 Processing scheduled post ${postId}`)
    
    // 1. 게시물 상태를 'posting'으로 변경
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
          throw new Error(`Account ${accountId} not found`)
        }

        // post_accounts 상태를 'uploading'으로 변경
        await supabase
          .from('post_accounts')
          .update({ upload_status: 'uploading' })
          .eq('post_id', postId)
          .eq('account_id', accountId)

        // 플랫폼별 업로드 처리
        console.log('🔍 Platform check:', {
          platform: account.platform,
          hasFileData: !!fileData,
          hasBuffer: !!fileData?.buffer,
          condition1: account.platform.toLowerCase() === 'youtube',
          condition2: !!fileData,
          condition3: !!fileData?.buffer
        })
        
        if (account.platform.toLowerCase() === 'youtube' && fileData && fileData.buffer) {
          console.log('🔍 Entering YouTube upload...')
          
          // base64 문자열을 Buffer로 복원
          const actualFileData = {
            buffer: Buffer.from(fileData.buffer, 'base64'),
            fileName: fileData.fileName,
            fileSize: fileData.fileSize
          }
          
          const result = await uploadToYouTube({
            account,
            fileData: actualFileData,
            settings: platformSettings.youtube || {},
          })

          if (result.success) {
            // 성공 시 결과 저장
            await supabase
              .from('post_accounts')
              .update({
                upload_status: 'success',
                platform_post_id: result.videoId,
                platform_url: result.videoUrl,
                uploaded_at: new Date().toISOString(),
              })
              .eq('post_id', postId)
              .eq('account_id', accountId)

            results.push({ accountId, success: true, url: result.videoUrl })
          } else {
            // 안전하게 에러 메시지 추출
            let errorMessage = 'YouTube upload failed - unknown error'
            
            try {
              const errorObj = (result as any).error
              if (errorObj) {
                if (typeof errorObj === 'string') {
                  errorMessage = errorObj
                } else if (errorObj.message) {
                  errorMessage = errorObj.message
                } else {
                  errorMessage = 'YouTube upload failed - ' + JSON.stringify(errorObj)
                }
              }
            } catch (e) {
              errorMessage = 'YouTube upload failed - error parsing failed'
            }
            
            console.error(`YouTube upload failed for account ${accountId}:`, errorMessage)
            throw new Error(errorMessage)
          }
        } else if (account.platform.toLowerCase() === 'youtube') {
          throw new Error('YouTube upload failed - missing file data or buffer')
        } else {
          throw new Error(`Platform ${account.platform} not supported yet`)
        }

      } catch (error) {
        // 계정별 업로드 실패 시
        console.error(`❌ Upload failed for account ${accountId}:`, error)
        
        await supabase
          .from('post_accounts')
          .update({
            upload_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('post_id', postId)
          .eq('account_id', accountId)

        const errorMsg = error instanceof Error ? error.message : String(error || 'Unknown error')
        results.push({ accountId, success: false, error: errorMsg })
      }
    }

    // 3. 전체 결과에 따라 게시물 상태 업데이트
    const successCount = results.filter(r => r.success).length
    const finalStatus = successCount > 0 ? 'posted' : 'failed'

    await supabase
      .from('posts')
      .update({
        status: finalStatus,
        posted_at: successCount > 0 ? new Date().toISOString() : null,
        platform_results: results,
      })
      .eq('id', postId)

    console.log(`✅ Post ${postId} processed: ${successCount}/${accountIds.length} accounts succeeded`)
    
    return {
      success: true,
      results,
      successCount,
      totalCount: accountIds.length,
    }

  } catch (error) {
    console.error(`❌ Failed to process post ${postId}:`, error)
    
    // 전체 실패 시 상태 업데이트
    await supabase
      .from('posts')
      .update({ status: 'failed' })
      .eq('id', postId)

    throw error
  }
}

// YouTube 업로드 함수 (기존 코드 재사용)
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
    // 필수 데이터 검증
    if (!fileData || !fileData.buffer) {
      throw new Error('File data or buffer is missing')
    }
    
    if (!Buffer.isBuffer(fileData.buffer)) {
      throw new Error('File buffer is not a valid Buffer object')
    }
    
    if (!fileData.buffer.length) {
      throw new Error('File buffer is empty')
    }
    
    if (!account.access_token) {
      throw new Error('YouTube access token is missing')
    }

    // Access token 갱신 함수
    const refreshAccessToken = async () => {
      if (!account.refresh_token) {
        throw new Error('Refresh token is missing - need to reconnect YouTube account')
      }

      console.log('🔄 Refreshing YouTube access token...')
      
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
        throw new Error('Failed to refresh access token - need to reconnect YouTube account')
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
      console.log('✅ Access token refreshed successfully')
    }

    console.log('🔍 YouTube upload start:', {
      bufferType: typeof fileData.buffer,
      bufferConstructor: fileData.buffer?.constructor?.name,
      bufferLength: fileData.buffer?.length,
      fileName: fileData.fileName,
      hasAccessToken: !!account.access_token,
      isBuffer: Buffer.isBuffer(fileData.buffer)
    })

    const metadata = {
      snippet: {
        title: settings.title || 'Untitled Video',
        description: settings.description || '',
        tags: [],
        categoryId: '22',
        defaultLanguage: 'ko',
        defaultAudioLanguage: 'ko'
      },
      status: {
        privacyStatus: settings.privacy || 'public',
        selfDeclaredMadeForKids: false
      }
    }

    // Resumable upload 시작 (토큰 갱신 재시도 포함)
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

    // 401 에러 시 토큰 갱신 후 재시도
    if (initResponse.status === 401) {
      console.log('🔄 Access token expired, refreshing...')
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

    if (!initResponse.ok) {
      const errorText = await initResponse.text()
      console.error('🚨 YouTube API init failed:', {
        status: initResponse.status,
        statusText: initResponse.statusText,
        error: errorText
      })
      throw new Error(`Upload initialization failed: ${initResponse.status} ${errorText}`)
    }

    const uploadUrl = initResponse.headers.get('location')
    if (!uploadUrl) {
      throw new Error('No upload URL received')
    }

    // 실제 파일 업로드
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*'
      },
      body: new Uint8Array(fileData.buffer)
    })

    if (!uploadResponse.ok) {
      throw new Error('File upload failed')
    }

    const result = await uploadResponse.json()
    
    return { 
      success: true, 
      videoId: result.id,
      videoUrl: `https://www.youtube.com/watch?v=${result.id}`
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}