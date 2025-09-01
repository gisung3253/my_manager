import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OAuth } from 'oauth'

/**
 * Twitter OAuth 인증 콜백 처리 API
 * GET /api/connection/twitter/callback
 * 
 * Twitter OAuth 인증 후 리디렉션되는 엔드포인트
 * 인증 토큰을 액세스 토큰으로 교환하고 Twitter 계정 정보를 가져와 저장합니다
 */
export async function GET(request: NextRequest) {
  try {
    // 1. URL 파라미터 추출
    const { searchParams } = new URL(request.url)
    const oauth_token = searchParams.get('oauth_token')       // OAuth 토큰
    const oauth_verifier = searchParams.get('oauth_verifier') // OAuth 검증 코드
    const denied = searchParams.get('denied')                 // 사용자가 권한 부여를 거부했는지 여부

    // 에러 처리: 사용자가 권한 부여를 거부한 경우
    if (denied) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=접근_권한_거부됨`)
    }

    // 에러 처리: OAuth 토큰 또는 검증 코드가 없는 경우
    if (!oauth_token || !oauth_verifier) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=인증_정보_없음`)
    }

    // 2. 임시 저장된 토큰 정보 조회
    const { data: tokenData, error: tokenError } = await supabase
      .from('temp_oauth_tokens')
      .select('*')
      .eq('oauth_token', oauth_token)
      .single()

    // 에러 처리: 임시 토큰 정보를 찾을 수 없는 경우
    if (tokenError || !tokenData) {
      console.error('임시 토큰 조회 실패:', tokenError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=토큰_정보_없음`)
    }

    // 임시 저장된 정보에서 사용자 ID와 토큰 시크릿 추출
    const userId = tokenData.user_id
    const oauthTokenSecret = tokenData.oauth_token_secret

    // 3. Twitter OAuth 1.0a 인증 객체 생성
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
      // 4. 액세스 토큰으로 교환
      oauth.getOAuthAccessToken(
        oauth_token,
        oauthTokenSecret,
        oauth_verifier,
        async (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
          // 에러 처리: 액세스 토큰 교환 실패
          if (error) {
            console.error('OAuth 액세스 토큰 오류:', error)
            resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=토큰_교환_실패`))
            return
          }

          try {
            // 5. Twitter API를 통해 사용자 정보 가져오기
            oauth.get(
              'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
              oauthAccessToken,
              oauthAccessTokenSecret,
              async (error, data, response) => {
                // 에러 처리: 사용자 정보 가져오기 실패
                if (error) {
                  console.error('사용자 데이터 가져오기 실패:', error)
                  resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=사용자_정보_가져오기_실패`))
                  return
                }

                try {
                  // 6. Twitter API 응답 파싱
                  const user = JSON.parse(data as string)

                  // 7. 데이터베이스에 연결 정보 저장
                  const { error: dbError } = await supabase
                    .from('connected_accounts')
                    .insert({
                      user_id: userId,                       // 사용자 ID
                      platform: 'twitter',                   // 플랫폼 (Twitter)
                      account_id: user.id_str,               // Twitter 계정 ID
                      account_name: user.name,               // 표시 이름
                      username: user.screen_name,            // 사용자 이름 (@handle)
                      profile_image_url: user.profile_image_url_https, // 프로필 이미지
                      access_token: oauthAccessToken,        // 액세스 토큰
                      access_token_secret: oauthAccessTokenSecret, // 액세스 토큰 시크릿 (OAuth 1.0a 전용)
                      refresh_token: null,                   // 리프레시 토큰 (OAuth 1.0a에서는 사용 안 함)
                      expires_at: null                       // 만료 시간 (OAuth 1.0a에서는 만료되지 않음)
                    })

                  // 에러 처리: 데이터베이스 저장 실패
                  if (dbError) {
                    console.error('데이터베이스 오류:', dbError)
                    resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=데이터베이스_저장_실패`))
                    return
                  }

                  // 8. 임시 저장된 토큰 정보 삭제
                  await supabase
                    .from('temp_oauth_tokens')
                    .delete()
                    .eq('oauth_token', oauth_token)

                  // 9. 성공 로그 기록 및 리디렉션
                  console.log('Twitter 계정 연결 완료:', user.screen_name)
                  resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?success=twitter_connected`))

                } catch (parseError) {
                  // 에러 처리: 사용자 데이터 파싱 실패
                  console.error('사용자 데이터 파싱 실패:', parseError)
                  resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=데이터_파싱_실패`))
                }
              }
            )
          } catch (userError) {
            // 에러 처리: 사용자 정보 요청 실패
            console.error('사용자 정보 요청 오류:', userError)
            resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=사용자_정보_요청_실패`))
          }
        }
      )
    })

  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error('Twitter 콜백 오류:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=서버_오류`)
  }
}