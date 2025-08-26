import Bull from 'bull'
import redis from './redis'

// 큐 생성 (예약된 게시물 처리용) - Upstash 설정
export const scheduledPostsQueue = new Bull('scheduled-posts', {
  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD!,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 10, // 완료된 작업 10개만 보관
    removeOnFail: 5,      // 실패한 작업 5개만 보관
    attempts: 3,          // 최대 3번 재시도
    backoff: {
      type: 'exponential',
      delay: 2000,        // 2초부터 시작해서 점점 늘어남
    },
  },
})

// 큐 상태 로그
scheduledPostsQueue.on('ready', () => {
  console.log('📋 Scheduled Posts Queue is ready')
})

scheduledPostsQueue.on('error', (error) => {
  console.error('❌ Queue error:', error)
})

scheduledPostsQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message)
})

scheduledPostsQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`)
})

// 큐 워커 설정 - 작업 처리 함수 연결
import { processScheduledPost } from './jobs/processScheduledPosts'

scheduledPostsQueue.process('process-scheduled-post', async (job) => {
  return await processScheduledPost(job)
})

console.log('🔄 Queue worker started - ready to process scheduled posts')

export default scheduledPostsQueue