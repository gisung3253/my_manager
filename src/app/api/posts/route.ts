import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { schedulePost } from '@/lib/jobs/schedulePost'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // 기본 정보
    const userId = formData.get('userId') as string
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const postType = formData.get('postType') as string
    const selectedAccounts = formData.get('selectedAccounts') as string
    
    // 파일 정보
    const videoFile = formData.get('video') as File | null
    
    // 예약 정보
    const isScheduled = formData.get('isScheduled') === 'true'
    const scheduledAt = formData.get('scheduledAt') as string
    
    // 플랫폼 설정
    const platformSettings = formData.get('platformSettings') as string

    if (!userId || !content || !postType || !selectedAccounts) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const accountIds = JSON.parse(selectedAccounts)
    const platformSettingsObj = platformSettings ? JSON.parse(platformSettings) : {}

    // 파일 정보 저장 (실제 파일은 임시로 메타데이터만)
    let fileInfo = null
    if (videoFile) {
      fileInfo = {
        file_name: videoFile.name,
        file_size: videoFile.size,
        file_url: null // 실제 파일은 업로드 시 처리
      }
    }

    // posts 테이블에 게시물 저장
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: parseInt(userId),
        title,
        content,
        post_type: postType,
        status: isScheduled ? 'scheduled' : 'draft',
        scheduled_at: isScheduled && scheduledAt ? scheduledAt : null,
        platform_settings: platformSettingsObj,
        ...fileInfo
      })
      .select()
      .single()

    if (postError) {
      console.error('Post save error:', postError)
      return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
    }

    // post_accounts 테이블에 선택된 계정들 저장
    const postAccountsData = accountIds.map((accountId: number) => ({
      post_id: post.id,
      account_id: accountId,
      upload_status: 'pending'
    }))

    const { error: accountsError } = await supabase
      .from('post_accounts')
      .insert(postAccountsData)

    if (accountsError) {
      console.error('Post accounts save error:', accountsError)
      return NextResponse.json({ error: 'Failed to save post accounts' }, { status: 500 })
    }

    // 예약 게시물인 경우 큐에 작업 추가
    if (isScheduled && scheduledAt) {
      try {
        // 파일 데이터 준비 (예약 실행 시 사용)
        let fileData = null
        if (videoFile) {
          const bytes = await videoFile.arrayBuffer()
          const buffer = Buffer.from(bytes)
          fileData = {
            buffer: buffer.toString('base64'), // Redis 저장을 위해 base64로 변환
            fileName: videoFile.name,
            fileSize: videoFile.size
          }
        }

        await schedulePost({
          postId: post.id,
          userId: parseInt(userId),
          accountIds,
          platformSettings: platformSettingsObj,
          scheduledAt: new Date(scheduledAt), // 이미 시간대 정보가 포함된 문자열
          fileData: fileData || undefined
        })

        console.log(`📅 Scheduled post ${post.id} added to queue`)
        
      } catch (queueError) {
        console.error('Failed to add to queue:', queueError)
        // 큐 추가 실패해도 게시물 저장은 유지
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        status: post.status,
        scheduled_at: post.scheduled_at
      }
    })

  } catch (error) {
    console.error('Save post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') // 'all', 'scheduled', 'posted', 'draft'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    let query = supabase
      .from('posts')
      .select(`
        *,
        post_accounts (
          id,
          account_id,
          upload_status,
          platform_post_id,
          platform_url,
          error_message,
          uploaded_at,
          connected_accounts (
            platform,
            account_name,
            profile_image_url
          )
        )
      `)
      .eq('user_id', parseInt(userId))
      .order('created_at', { ascending: false })

    // 상태별 필터링
    if (status && status !== 'all') {
      if (status === 'posted') {
        query = query.eq('status', 'posted')
      } else if (status === 'scheduled') {
        query = query.eq('status', 'scheduled')
      } else {
        query = query.eq('status', status)
      }
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Fetch posts error:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })

  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}