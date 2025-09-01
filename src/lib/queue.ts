import Bull from 'bull'
import redis from './redis'
import { processScheduledPost } from './jobs/processScheduledPosts'

/**
 * Bull 큐 설정
 * 
 * 예약 게시물 처리를 위한 비동기 작업 큐를 설정합니다.
 * Redis를 백엔드로 사용하여 작업을 저장하고 관리합니다.
 */

// 큐 생성 (예약된 게시물 처리용)
export const scheduledPostsQueue = new Bull('scheduled-posts', {
  // Redis 연결 설정
  redis: {
    host: process.env.REDIS_HOST!,                         // Redis 호스트
    port: parseInt(process.env.REDIS_PORT || '6380'),      // Redis 포트
    password: process.env.REDIS_PASSWORD!,                 // Redis 비밀번호
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined, // TLS/SSL 연결 사용 여부
  },
  
  // 작업 기본 설정
  defaultJobOptions: {
    removeOnComplete: 10,  // 완료된 작업 10개만 보관 (나머지는 자동 삭제)
    removeOnFail: 5,       // 실패한 작업 5개만 보관 (나머지는 자동 삭제)
    attempts: 3,           // 실패 시 최대 3번 재시도
    backoff: {
      type: 'exponential', // 지수적으로 증가하는 재시도 간격
      delay: 2000,         // 첫 재시도까지 2초 대기 (이후 4초, 8초...)
    },
  },
})

// 큐 이벤트 리스너 설정
scheduledPostsQueue.on('ready', () => {
  console.log('📋 예약 게시물 큐 준비 완료')
})

scheduledPostsQueue.on('error', (error) => {
  console.error('❌ 큐 오류 발생:', error)
})

scheduledPostsQueue.on('failed', (job, err) => {
  console.error(`❌ 작업 ${job.id} 실패: ${err.message}`)
})

scheduledPostsQueue.on('completed', (job) => {
  console.log(`✅ 작업 ${job.id} 성공적으로 완료됨`)
})

// 큐 워커 설정 - 작업 처리 함수 연결
scheduledPostsQueue.process('process-scheduled-post', async (job) => {
  return await processScheduledPost(job)
})

console.log('🔄 큐 워커 시작됨 - 예약 게시물 처리 준비 완료')

export default scheduledPostsQueue