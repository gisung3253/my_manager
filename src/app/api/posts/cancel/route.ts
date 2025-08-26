import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cancelScheduledPost as cancelQueueJob } from '@/lib/jobs/schedulePost'

export async function POST(request: NextRequest) {
  try {
    const { postId, userId } = await request.json()

    if (!postId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 게시물이 실제로 해당 사용자의 것이고 scheduled 상태인지 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found or not scheduled' }, { status: 404 })
    }

    // 1. Queue에서 예약된 작업 취소
    try {
      await cancelQueueJob(postId)
      console.log(`🗑️ Cancelled queue job for post ${postId}`)
    } catch (queueError) {
      console.error('Failed to cancel queue job:', queueError)
      // Queue 취소가 실패해도 계속 진행 (DB에서는 취소 처리)
    }

    // 2. 게시물 상태를 'cancelled'로 변경
    const { error: updateError } = await supabase
      .from('posts')
      .update({ 
        status: 'cancelled',
        scheduled_at: null // 예약 시간 제거
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Failed to update post status:', updateError)
      return NextResponse.json({ error: 'Failed to cancel post' }, { status: 500 })
    }

    // 3. post_accounts 상태도 업데이트
    const { error: accountsError } = await supabase
      .from('post_accounts')
      .update({ upload_status: 'cancelled' })
      .eq('post_id', postId)

    if (accountsError) {
      console.error('Failed to update post accounts:', accountsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Post cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}