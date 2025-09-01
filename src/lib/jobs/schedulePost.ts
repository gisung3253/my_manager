import { scheduledPostsQueue } from '../queue'
import { ScheduledPostJobData } from './processScheduledPosts'

/**
 * 게시물 예약에 필요한 매개변수 인터페이스
 */
interface SchedulePostParams extends Omit<ScheduledPostJobData, 'fileData'> {
  scheduledAt: Date       // 예약 시간
  fileData?: {            // 선택적 파일 데이터
    buffer: string        // base64 인코딩된 파일 데이터
    fileName: string      // 파일명
    fileSize: number      // 파일 크기
  }
}

/**
 * 게시물을 예약 큐에 추가하는 함수
 * 
 * 소셜 미디어 게시물을 지정된 미래 시간에 발행하도록 예약합니다.
 * @param params 게시물 예약에 필요한 정보 객체
 * @returns 예약 결과 정보
 */
export async function schedulePost(params: SchedulePostParams) {
  const { postId, userId, accountIds, platformSettings, scheduledAt, fileData } = params

  try {
    // 예약 시간까지의 지연 시간 계산 (밀리초)
    const delay = scheduledAt.getTime() - Date.now()
    
    // 과거 시간은 예약 불가
    if (delay < 0) {
      throw new Error('예약 시간은 미래 시간이어야 합니다')
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
      'process-scheduled-post',  // 작업 유형
      jobData,                   // 작업 데이터
      {
        delay,                  // 예약 시간까지 지연
        jobId: `post-${postId}`, // 중복 방지용 고유 ID
        removeOnComplete: 10,    // 완료된 작업 10개만 보관
        removeOnFail: 5,         // 실패한 작업 5개만 보관
        attempts: 3,             // 실패 시 최대 재시도 횟수
        backoff: {
          type: 'exponential',   // 지수적 재시도 간격
          delay: 2000,           // 첫 재시도 전 2초 대기
        },
      }
    )

    console.log(`📅 게시물 ${postId} 예약 완료 (작업 ID: ${job.id})`)
    console.log(`⏰ 실행 예정 시간: ${scheduledAt.toISOString()}`)
    
    return {
      success: true,
      jobId: job.id,
      scheduledAt: scheduledAt.toISOString(),
    }

  } catch (error) {
    console.error('게시물 예약 실패:', error)
    throw error
  }
}

/**
 * 예약된 작업을 취소하는 함수
 * 
 * 이미 큐에 등록된 예약 게시물을 취소합니다.
 * @param postId 취소할 게시물 ID
 * @returns 취소 결과 정보
 */
export async function cancelScheduledPost(postId: number) {
  try {
    const jobId = `post-${postId}`
    
    // 큐에서 해당 작업 찾기
    const jobs = await scheduledPostsQueue.getJobs(['delayed', 'waiting'])
    const job = jobs.find(j => j.id === jobId)
    
    if (job) {
      await job.remove()
      console.log(`❌ 게시물 ${postId} 예약 취소됨`)
      return { success: true, message: '작업이 취소되었습니다' }
    } else {
      console.log(`⚠️ 작업 ${jobId}를 큐에서 찾을 수 없습니다`)
      return { success: false, message: '작업을 찾을 수 없습니다' }
    }

  } catch (error) {
    console.error('예약 게시물 취소 실패:', error)
    throw error
  }
}