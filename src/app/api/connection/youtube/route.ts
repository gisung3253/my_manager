import { NextRequest, NextResponse } from 'next/server'

/**
 * YouTube 계정 연결을 위한 OAuth 인증 흐름 시작 API
 * GET /api/connection/youtube
 * 
 * 쿼리 파라미터로 user_id가 필요함
 */
export async function GET(request: NextRequest) {
  // URL에서 쿼리 파라미터 추출
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  
  // 사용자 ID 유효성 검사
  if (!user_id) {
    return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 })
  }
  
  // Google OAuth 인증 URL 생성
  const googleOAuthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  
  // OAuth 요청에 필요한 파라미터 설정
  const params = {
    client_id: process.env.GOOGLE_CLIENT_ID!, // Google 개발자 콘솔의 클라이언트 ID
    redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection/youtube/callback`, // 인증 후 콜백 URL
    response_type: 'code', // 인증 코드 요청
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload', // 요청 권한 범위
    access_type: 'offline', // 리프레시 토큰 요청 (오프라인 접근)
    prompt: 'consent', // 사용자에게 항상 동의 화면 표시
    state: user_id // CSRF 방지 및 사용자 식별을 위해 사용자 ID를 state로 전달
  }

  // 설정한 파라미터를 OAuth URL에 추가
  Object.entries(params).forEach(([key, value]) => {
    googleOAuthURL.searchParams.append(key, value)
  })

  // 구성된 Google OAuth URL로 사용자 리디렉션
  return NextResponse.redirect(googleOAuthURL.toString())
}