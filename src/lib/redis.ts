import Redis from 'ioredis'

// Upstash Redis 연결 설정 - 간소화 버전
const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD!,
  tls: {},
  family: 4,  // IPv4 강제 사용
  connectTimeout: 60000,  // 1분
  maxRetriesPerRequest: null,
})

// 연결 상태 로그
redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error)
})

redis.on('ready', () => {
  console.log('🚀 Redis is ready to use')
})

export default redis