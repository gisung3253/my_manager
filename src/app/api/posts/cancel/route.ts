import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cancelScheduledPost as cancelQueueJob } from '@/lib/jobs/schedulePost'

/**
 * 예약된 게시물 취소 API
 * POST /api/posts/cancel
 * 
 * 예약된 게시물을 취소하고 큐에서 작업을 제거합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 본문에서 필요한 정보 추출
    const { postId, userId } = await request.json()

    // 필수 필드 검증
    if (!postId || !userId) {
      return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다' }, { status: 400 })
    }

    // 2. 게시물이 실제로 해당 사용자의 것이고 scheduled 상태인지 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .single()

    if (postError || !post) {
      return NextResponse.json({ 
        error: '예약된 게시물을 찾을 수 없거나 취소 권한이 없습니다' 
      }, { status: 404 })
    }

    // 3. 큐에서 예약된 작업 취소
    try {
      await cancelQueueJob(postId)
      console.log(`🗑️ 게시물 ${postId}의 예약 작업이 큐에서 취소되었습니다`)
    } catch (queueError) {
      console.error('큐 작업 취소 실패:', queueError)
      // 큐 취소가 실패해도 계속 진행 (데이터베이스에서는 취소 처리)
    }

    // 4. 게시물 상태를 'cancelled'로 변경
    const { error: updateError } = await supabase
      .from('posts')
      .update({ 
        status: 'cancelled',  // 상태를 '취소됨'으로 변경
        scheduled_at: null    // 예약 시간 제거
      })
      .eq('id', postId)

    if (updateError) {
      console.error('게시물 상태 업데이트 실패:', updateError)
      return NextResponse.json({ error: '게시물 취소에 실패했습니다' }, { status: 500 })
    }

    // 5. post_accounts 상태도 업데이트
    const { error: accountsError } = await supabase
      .from('post_accounts')
      .update({ upload_status: 'cancelled' })  // 각 계정별 업로드 상태도 '취소됨'으로 변경
      .eq('post_id', postId)

    if (accountsError) {
      console.error('게시물-계정 정보 업데이트 실패:', accountsError)
      // 이 단계에서 오류가 발생해도 주요 취소 작업은 완료됨
    }

    // 6. 성공 응답 반환
    return NextResponse.json({
      success: true,
      message: '게시물이 성공적으로 취소되었습니다'
    })

  } catch (error) {
    // 예상치 못한 오류 처리
    console.error('게시물 취소 중 오류 발생:', error)
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다' }, { status: 500 })
  }
}