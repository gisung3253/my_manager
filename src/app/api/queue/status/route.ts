import { NextRequest, NextResponse } from 'next/server'
import { scheduledPostsQueue } from '@/lib/queue'

export async function GET(request: NextRequest) {
  try {
    // 큐 상태 정보 가져오기
    const waiting = await scheduledPostsQueue.getWaiting()
    const active = await scheduledPostsQueue.getActive()
    const completed = await scheduledPostsQueue.getCompleted()
    const failed = await scheduledPostsQueue.getFailed()
    const delayed = await scheduledPostsQueue.getDelayed()

    // 다음에 실행될 작업들 (예약된 작업)
    const upcoming = delayed.slice(0, 10).map(job => ({
      id: job.id,
      postId: job.data.postId,
      scheduledFor: new Date(Date.now() + (job.opts.delay || 0)).toISOString(),
      data: {
        title: job.data.platformSettings?.youtube?.title || 'No title',
        accountCount: job.data.accountIds.length
      }
    }))

    return NextResponse.json({
      queue: {
        waiting: waiting.length,
        active: active.length, 
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      upcomingJobs: upcoming,
      isProcessing: active.length > 0,
    })

  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json({ error: 'Failed to get queue status' }, { status: 500 })
  }
}

// 큐 워커를 수동으로 시작하는 엔드포인트 (개발/디버깅용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'start-worker') {
      // 워커는 이미 queue.ts에서 자동 시작됨
      return NextResponse.json({ 
        success: true, 
        message: 'Queue worker is already running' 
      })
    }

    if (action === 'clear-failed') {
      await scheduledPostsQueue.clean(0, 'failed')
      return NextResponse.json({ 
        success: true, 
        message: 'Failed jobs cleared' 
      })
    }

    if (action === 'retry-failed') {
      const failedJobs = await scheduledPostsQueue.getFailed()
      for (const job of failedJobs) {
        await job.retry()
      }
      return NextResponse.json({ 
        success: true, 
        message: `${failedJobs.length} jobs retried` 
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    console.error('Queue action error:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}