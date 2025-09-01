import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const accountId = formData.get('accountId') as string
    const content = formData.get('content') as string
    const userId = formData.get('userId') as string
    const mediaFile = formData.get('media') as File | null // 이미지 또는 비디오

    if (!accountId || !content || !userId) {
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

    // OAuth 1.0a 토큰은 만료되지 않으므로 새로고침 불필요
    console.log('Using OAuth 1.0a tokens for Twitter upload')

    // Twitter에 트윗 업로드
    const tweetResult: any = await uploadToTwitter({
      content,
      mediaFile,
      account
    })

    if (tweetResult.success) {
      return NextResponse.json({
        success: true,
        tweetId: tweetResult.tweetId,
        tweetUrl: `https://twitter.com/${account.username}/status/${tweetResult.tweetId}`
      })
    } else {
      return NextResponse.json({ 
        error: tweetResult.error || 'Upload failed' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Twitter upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


async function uploadToTwitter({
  content,
  mediaFile,
  account
}: {
  content: string
  mediaFile: File | null
  account: any
}) {
  try {
    let mediaIds: string[] = []

    // 임시로 미디어 업로드 비활성화하고 텍스트만 테스트
    console.log('Skipping media upload for now, testing text-only tweet')

    // OAuth 1.0a를 사용한 트윗 생성
    const { OAuth } = require('oauth')
    
    const oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      process.env.TWITTER_API_KEY!,
      process.env.TWITTER_API_SECRET!,
      '1.0A',
      null,
      'HMAC-SHA1'
    )

    return new Promise((resolve) => {
      // Twitter API 1.1 status update를 사용 (URL encoded)
      let tweetParams: any = {
        status: content
      }

      if (mediaIds.length > 0) {
        tweetParams.media_ids = mediaIds.join(',')
      }

      oauth.post(
        'https://api.twitter.com/1.1/statuses/update.json',
        account.access_token,
        account.access_token_secret,
        tweetParams,
        'application/x-www-form-urlencoded',
        (error: any, data: any, _response: any) => {
          if (error) {
            console.error('Tweet creation failed:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            resolve({ success: false, error: `Tweet creation failed: ${JSON.stringify(error)}` })
            return
          }

          try {
            const result: any = typeof data === 'string' ? JSON.parse(data as string) : data
            resolve({
              success: true,
              tweetId: result.id_str,
              text: result.text
            })
          } catch (parseError) {
            console.error('Failed to parse tweet response:', parseError)
            resolve({ success: false, error: 'Failed to parse response' })
          }
        }
      )
    })

  } catch (error) {
    console.error('Twitter upload error:', error)
    return { success: false, error: 'Upload failed' }
  }
}

async function uploadMediaToTwitter(mediaFile: File, account: any) {
  try {
    const bytes = await mediaFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // OAuth 1.0a를 사용한 미디어 업로드
    const { OAuth } = require('oauth')
    
    const oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      process.env.TWITTER_API_KEY!,
      process.env.TWITTER_API_SECRET!,
      '1.0A',
      null,
      'HMAC-SHA1'
    )

    return new Promise((resolve) => {
      // Base64 인코딩으로 미디어 업로드 (OAuth 1.0a와 호환)
      const mediaData = buffer.toString('base64')
      
      const postData = {
        media_data: mediaData
      }

      oauth.post(
        'https://upload.twitter.com/1.1/media/upload.json',
        account.access_token,
        account.access_token_secret,
        postData,
        'application/x-www-form-urlencoded',
        (error: any, data: any, _response: any) => {
          if (error) {
            console.error('Media upload failed:', error)
            resolve({ success: false, error: 'Media upload failed' })
            return
          }

          try {
            const result: any = typeof data === 'string' ? JSON.parse(data as string) : data
            if (result.media_id_string) {
              resolve({ success: true, mediaId: result.media_id_string })
            } else {
              console.error('Media upload failed:', result)
              resolve({ success: false, error: result.errors?.[0]?.message || 'Media upload failed' })
            }
          } catch (parseError) {
            console.error('Failed to parse media upload response:', parseError)
            resolve({ success: false, error: 'Failed to parse response' })
          }
        }
      )
    })

  } catch (error) {
    console.error('Media upload error:', error)
    return { success: false, error: 'Media upload failed' }
  }
}