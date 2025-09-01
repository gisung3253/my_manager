import { NextRequest, NextResponse } from 'next/server'
import { scheduledPostsQueue } from '@/lib/queue'

/**
 * 큐 상태를 조회하는 API
 * GET /api/queue/status
 * 
 * 작업 큐의 현재 상태와 예약된 작업 목록을 조회합니다
 */
export async function GET(request: NextRequest) {
  try {
    // 큐 상태 정보 가져오기
    const waiting = await scheduledPostsQueue.getWaiting()   // 대기 중인 작업
    const active = await scheduledPostsQueue.getActive()     // 실행 중인 작업
    const completed = await scheduledPostsQueue.getCompleted() // 완료된 작업
    const failed = await scheduledPostsQueue.getFailed()     // 실패한 작업
    const delayed = await scheduledPostsQueue.getDelayed()   // 지연된(예약된) 작업

    // 다음에 실행될 작업들 (예약된 작업 중 최대 10개)
    const upcoming = delayed.slice(0, 10).map(job => ({
      id: job.id,                   // 작업 ID
      postId: job.data.postId,      // 게시물 ID
      scheduledFor: new Date(Date.now() + (job.opts.delay || 0)).toISOString(), // 예약 실행 시간
      data: {
        title: job.data.platformSettings?.youtube?.title || '제목 없음', // 게시물 제목
        accountCount: job.data.accountIds.length // 게시할 계정 수
      }
    }))

    // 큐 상태 정보 응답
    return NextResponse.json({
      queue: {
        waiting: waiting.length,    // 대기 중인 작업 수
        active: active.length,      // 실행 중인 작업 수
        completed: completed.length, // 완료된 작업 수
        failed: failed.length,      // 실패한 작업 수
        delayed: delayed.length,    // 지연된(예약된) 작업 수
      },
      upcomingJobs: upcoming,       // 다음에 실행될 작업 목록
      isProcessing: active.length > 0, // 현재 작업 처리 중 여부
    })

  } catch (error) {
    // 오류 처리
    console.error('큐 상태 조회 오류:', error)
    return NextResponse.json({ error: '큐 상태 조회에 실패했습니다' }, { status: 500 })
  }
}

/**
 * 큐 관리 작업을 수행하는 API
 * POST /api/queue/status
 * 
 * 실패한 작업 정리 및 재시도 등 큐 관리 작업을 수행합니다
 * 개발 및 디버깅 용도로 사용됩니다
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 수행할 작업 추출
    const body = await request.json()
    const { action } = body

    // 워커 시작 요청 (이미 queue.ts에서 자동으로 시작됨)
    if (action === 'start-worker') {
      return NextResponse.json({ 
        success: true, 
        message: '큐 워커는 이미 실행 중입니다' 
      })
    }

    // 실패한 작업 정리 요청
    if (action === 'clear-failed') {
      // 모든 실패한 작업 제거 (0: 모든 작업, 'failed': 실패한 작업만)
      await scheduledPostsQueue.clean(0, 'failed')
      return NextResponse.json({ 
        success: true, 
        message: '실패한 작업이 모두 정리되었습니다' 
      })
    }

    // 실패한 작업 재시도 요청
    if (action === 'retry-failed') {
      // 모든 실패한 작업 조회
      const failedJobs = await scheduledPostsQueue.getFailed()
      
      // 각 작업을 재시도
      for (const job of failedJobs) {
        await job.retry()
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${failedJobs.length}개의 작업을 재시도합니다` 
      })
    }

    // 알 수 없는 작업 요청
    return NextResponse.json({ error: '알 수 없는 작업입니다' }, { status: 400 })

  } catch (error) {
    // 오류 처리
    console.error('큐 작업 실행 오류:', error)
    return NextResponse.json({ error: '작업 수행에 실패했습니다' }, { status: 500 })
  }
}