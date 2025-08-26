import { scheduledPostsQueue } from '../queue'
import { ScheduledPostJobData } from './processScheduledPosts'

// 게시물을 예약 큐에 추가하는 함수
export async function schedulePost({
  postId,
  userId,
  accountIds,
  platformSettings,
  scheduledAt,
  fileData
}: {
  postId: number
  userId: number
  accountIds: number[]
  platformSettings: any
  scheduledAt: Date
  fileData?: {
    buffer: string // base64 문자열로 전달됨
    fileName: string
    fileSize: number
  }
}) {
  try {
    // 예약 시간까지의 지연 시간 계산 (밀리초)
    const delay = scheduledAt.getTime() - Date.now()
    
    if (delay < 0) {
      throw new Error('Scheduled time must be in the future')
    }

    // Job 데이터 준비
    const jobData: ScheduledPostJobData = {
      postId,
      userId,
      accountIds,
      platformSettings,
      fileData
    }

    // 큐에 지연 작업 추가
    const job = await scheduledPostsQueue.add(
      'process-scheduled-post',
      jobData,
      {
        delay, // 지연 시간
        jobId: `post-${postId}`, // 중복 방지용 고유 ID
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    )

    console.log(`📅 Scheduled post ${postId} added to queue (Job ID: ${job.id})`)
    console.log(`⏰ Will execute at: ${scheduledAt.toISOString()}`)
    
    return {
      success: true,
      jobId: job.id,
      scheduledAt: scheduledAt.toISOString(),
    }

  } catch (error) {
    console.error('Failed to schedule post:', error)
    throw error
  }
}

// 예약된 작업 취소하는 함수
export async function cancelScheduledPost(postId: number) {
  try {
    const jobId = `post-${postId}`
    
    // 큐에서 해당 작업 찾기
    const jobs = await scheduledPostsQueue.getJobs(['delayed', 'waiting'])
    const job = jobs.find(j => j.id === jobId)
    
    if (job) {
      await job.remove()
      console.log(`❌ Cancelled scheduled post ${postId}`)
      return { success: true, message: 'Job cancelled' }
    } else {
      console.log(`⚠️  Job ${jobId} not found in queue`)
      return { success: false, message: 'Job not found' }
    }

  } catch (error) {
    console.error('Failed to cancel scheduled post:', error)
    throw error
  }
}