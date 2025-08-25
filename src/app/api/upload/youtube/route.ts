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

    // YouTube API 업로드
    const uploadResponse = await uploadToYoutube({
      buffer,
      fileName: videoFile.name,
      title,
      description: description || '',
      privacy: privacy || 'public',
      accessToken: account.access_token
    })

    if (uploadResponse.success) {
      return NextResponse.json({
        success: true,
        videoId: uploadResponse.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.videoId}`
      })
    } else {
      return NextResponse.json({ 
        error: uploadResponse.error || 'Upload failed' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('YouTube upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return { success: false, error: 'Upload initialization failed' }
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