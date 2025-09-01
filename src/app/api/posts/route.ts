import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { schedulePost } from '@/lib/jobs/schedulePost'

/**
 * 게시물 생성 API
 * POST /api/posts
 * 
 * 새 게시물을 생성하고 필요시 예약 발행 작업을 큐에 등록합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 폼 데이터 파싱
    const formData = await request.formData()
    
    // 기본 정보 추출
    const userId = formData.get('userId') as string
    const title = formData.get('title') as string
    const content = formData.get('content') as string || formData.get('mainCaption') as string
    const postType = formData.get('postType') as string
    const selectedAccounts = formData.get('selectedAccounts') as string
    
    // 파일 정보 (동영상 등)
    const videoFile = formData.get('video') as File | null
    
    // 예약 설정
    const isScheduled = formData.get('isScheduled') === 'true'
    const scheduledAt = formData.get('scheduledAt') as string
    
    // 플랫폼별 설정 (JSON 문자열)
    const platformSettings = formData.get('platformSettings') as string

    // 2. 필수 필드 검증
    if (!userId || !content || !postType || !selectedAccounts) {
      return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다' }, { status: 400 })
    }

    // 문자열을 객체로 변환
    const accountIds = JSON.parse(selectedAccounts)
    const platformSettingsObj = platformSettings ? JSON.parse(platformSettings) : {}

    // 3. 파일 정보 준비 (메타데이터만)
    let fileInfo = null
    if (videoFile) {
      fileInfo = {
        file_name: videoFile.name,
        file_size: videoFile.size,
        file_url: null // 실제 파일은 업로드 시 처리됨
      }
    }

    // 4. 게시물 기본 정보 저장 (posts 테이블)
    const koreanTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString()
    
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: parseInt(userId),
        title,
        content,
        post_type: postType,
        status: isScheduled ? 'scheduled' : 'draft', // 예약 여부에 따라 상태 설정
        scheduled_at: isScheduled && scheduledAt ? scheduledAt : null,
        platform_settings: platformSettingsObj,
        created_at: koreanTime,
        updated_at: koreanTime,
        ...fileInfo
      })
      .select()
      .single()

    if (postError) {
      console.error('게시물 저장 오류:', postError)
      return NextResponse.json({ error: '게시물 저장에 실패했습니다' }, { status: 500 })
    }

    // 5. 게시물-계정 연결 정보 저장 (post_accounts 테이블)
    const postAccountsData = accountIds.map((accountId: number) => ({
      post_id: post.id,
      account_id: accountId,
      upload_status: 'pending' // 대기 상태로 초기화
    }))

    const { error: accountsError } = await supabase
      .from('post_accounts')
      .insert(postAccountsData)

    if (accountsError) {
      console.error('게시물-계정 연결 저장 오류:', accountsError)
      return NextResponse.json({ error: '계정 연결 정보 저장에 실패했습니다' }, { status: 500 })
    }

    // 6. 예약 게시물인 경우 작업 큐에 등록
    if (isScheduled && scheduledAt) {
      try {
        // 파일 데이터 준비 (base64로 Redis에 저장)
        let fileData = null
        if (videoFile) {
          // 파일 크기 체크 (8MB 제한)
          if (videoFile.size > 8 * 1024 * 1024) {
            return NextResponse.json({ 
              error: '파일 크기가 너무 큽니다. 8MB 이하의 파일을 사용해주세요.' 
            }, { status: 400 })
          }
          
          const bytes = await videoFile.arrayBuffer()
          const buffer = Buffer.from(bytes)
          fileData = {
            buffer: buffer.toString('base64'),
            fileName: videoFile.name,
            fileSize: videoFile.size
          }
        }

        // 예약 작업 큐에 등록
        await schedulePost({
          postId: post.id,
          userId: parseInt(userId),
          accountIds,
          platformSettings: platformSettingsObj,
          scheduledAt: new Date(scheduledAt), // 시간대 정보가 포함된 문자열을 Date 객체로 변환
          fileData: fileData || undefined
        })

        console.log(`📅 게시물 ${post.id} 예약 발행 작업이 큐에 등록되었습니다`)
        
      } catch (queueError) {
        console.error('큐 등록 실패:', queueError)
        // 큐 등록 실패해도 게시물 저장은 유지 (별도 알림 필요시 추가)
      }
    }

    // 7. 성공 응답 반환
    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        status: post.status,
        scheduled_at: post.scheduled_at
      }
    })

  } catch (error) {
    // 예상치 못한 오류 처리
    console.error('게시물 저장 중 오류 발생:', error)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다' }, { status: 500 })
  }
}

/**
 * 게시물 목록 조회 API
 * GET /api/posts
 * 
 * 사용자의 게시물 목록을 조회합니다.
 * 상태별 필터링이 가능합니다 (all, scheduled, posted, draft 등).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') // 'all', 'scheduled', 'posted', 'draft'

    // 2. 필수 파라미터 검증
    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 })
    }

    // 3. Supabase 쿼리 구성
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

    // 4. 상태별 필터링
    if (status && status !== 'all') {
      if (status === 'posted') {
        query = query.eq('status', 'posted')
      } else if (status === 'scheduled') {
        query = query.eq('status', 'scheduled')
      } else {
        query = query.eq('status', status)
      }
    }

    // 5. 데이터 조회 실행
    const { data: posts, error } = await query

    // 6. 오류 처리
    if (error) {
      console.error('게시물 조회 오류:', error)
      return NextResponse.json({ error: '게시물 목록을 가져오는데 실패했습니다' }, { status: 500 })
    }

    // 7. 성공 응답
    return NextResponse.json({ posts: posts || [] })

  } catch (error) {
    // 예상치 못한 오류 처리
    console.error('게시물 조회 중 오류 발생:', error)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다' }, { status: 500 })
  }
}