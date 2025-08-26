import Redis from 'ioredis'

// Upstash Redis 연결 설정
const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD!,
  tls: {
    rejectUnauthorized: false,
    requestCert: false,
    agent: false
  },
  family: 4,
  connectTimeout: 30000,
  lazyConnect: true,
  retryDelayOnFailover: 1000,
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