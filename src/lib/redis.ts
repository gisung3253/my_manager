import Redis from 'ioredis'

/**
 * Redis 클라이언트 설정
 * 
 * 소셜 미디어 토큰, 캐싱, 큐 관리 등에 사용됩니다.
 * Upstash Redis 호스팅 서비스를 사용하고 있습니다.
 */

// 환경 변수에서 Redis 연결 정보 가져오기
const redisHost = process.env.REDIS_HOST
const redisPort = parseInt(process.env.REDIS_PORT || '6379')
const redisPassword = process.env.REDIS_PASSWORD

// 필수 환경 변수 확인
if (!redisHost || !redisPassword) {
  console.warn('⚠️ Redis 환경 변수가 설정되지 않았습니다')
}

// Redis 클라이언트 인스턴스 생성
const redis = new Redis({
  host: redisHost!,                 // Redis 서버 호스트
  port: redisPort,                  // Redis 서버 포트
  password: redisPassword!,         // Redis 서버 비밀번호
  tls: {},                          // TLS/SSL 연결 사용 (Upstash는 암호화된 연결 필요)
  family: 4,                        // IPv4 강제 사용
  connectTimeout: 60000,            // 연결 타임아웃 (1분)
  maxRetriesPerRequest: null,       // 요청별 재시도 횟수 제한 없음
})

// 연결 상태 모니터링 이벤트 리스너
redis.on('connect', () => {
  console.log('✅ Redis 연결 성공')
})

redis.on('error', (error) => {
  console.error('❌ Redis 연결 오류:', error)
})

redis.on('ready', () => {
  console.log('🚀 Redis 사용 준비 완료')
})

export default redis