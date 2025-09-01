import { NextRequest, NextResponse } from 'next/server'
import { OAuth } from 'oauth'
import { supabase } from '@/lib/supabase'

/**
 * Twitter 계정 연결을 위한 OAuth 인증 초기화 API
 * POST /api/connection/twitter
 * 
 * 요청 본문에 userId가 필요함
 * Twitter OAuth 1.0a 인증 URL을 생성하여 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 사용자 ID 추출
    const { userId } = await request.json()
    
    // 사용자 ID 유효성 검사
    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 })
    }

    // Twitter OAuth 1.0a 인증 객체 생성
    const oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',      // 요청 토큰 URL
      'https://api.twitter.com/oauth/access_token',       // 액세스 토큰 URL
      process.env.TWITTER_API_KEY!,                       // Twitter API 키
      process.env.TWITTER_API_SECRET!,                    // Twitter API 시크릿
      '1.0A',                                             // OAuth 버전
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection/twitter/callback`, // 콜백 URL
      'HMAC-SHA1'                                         // 서명 방식
    )

    // Promise로 비동기 콜백 처리
    return new Promise<NextResponse>((resolve, reject) => {
      // 요청 토큰 발급 요청
      oauth.getOAuthRequestToken(async (error, oauthToken, oauthTokenSecret, results) => {
        // 요청 토큰 발급 실패 처리
        if (error) {
          console.error('OAuth 요청 토큰 오류:', error)
          resolve(NextResponse.json({ error: 'OAuth 초기화에 실패했습니다' }, { status: 500 }))
          return
        }

        // 요청 토큰과 시크릿을 임시로 데이터베이스에 저장
        // (콜백에서 이 정보를 사용하여 액세스 토큰으로 교환)
        const { error: insertError } = await supabase
          .from('temp_oauth_tokens')
          .insert({
            oauth_token: oauthToken,               // OAuth 토큰
            oauth_token_secret: oauthTokenSecret,   // OAuth 토큰 시크릿
            user_id: userId,                        // 연결할 사용자 ID
            created_at: new Date().toISOString()    // 생성 시간
          })

        // 데이터베이스 저장 실패 처리
        if (insertError) {
          console.error('임시 토큰 저장 실패:', insertError)
          resolve(NextResponse.json({ error: '임시 토큰 저장에 실패했습니다' }, { status: 500 }))
          return
        }

        // Twitter 인증 URL 생성 및 반환
        const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`
        resolve(NextResponse.json({ authUrl }))
      })
    })

  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error('Twitter OAuth 초기화 오류:', error)
    return NextResponse.json({ error: 'OAuth 초기화에 실패했습니다' }, { status: 500 })
  }
}