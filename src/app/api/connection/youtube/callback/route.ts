import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * YouTube OAuth 인증 콜백 처리 API
 * GET /api/connection/youtube/callback
 * 
 * Google OAuth 인증 후 리디렉션되는 엔드포인트
 * 인증 코드를 토큰으로 교환하고 YouTube 채널 정보를 가져와 저장합니다
 */
export async function GET(request: NextRequest) {
  try {
    // 1. URL 파라미터 추출
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')        // 인증 코드
    const error = searchParams.get('error')      // 오류 정보
    const state = searchParams.get('state')      // state로 전달된 사용자 ID

    // 에러 처리: 사용자가 권한 부여를 거부한 경우
    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=접근_권한_거부됨`)
    }

    // 에러 처리: 인증 코드나 사용자 ID가 없는 경우
    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=인증_코드_없음`)
    }
    
    // 사용자 ID 변환 (문자열 -> 숫자)
    const user_id = parseInt(state)

    // 2. 인증 코드를 액세스 토큰으로 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection/youtube/callback`,
      }),
    })

    const tokens = await tokenResponse.json()

    // 에러 처리: 토큰 교환 실패
    if (!tokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=토큰_발급_실패`)
    }

    // 3. YouTube 채널 정보 가져오기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    )

    const channelData = await channelResponse.json()

    // 에러 처리: 채널 정보가 없는 경우
    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=채널_정보_없음`)
    }

    const channel = channelData.items[0]

    // 4. 데이터베이스에 연결 정보 저장
    const { error: dbError } = await supabase
      .from('connected_accounts')
      .insert({
        user_id: user_id,                        // 사용자 ID
        platform: 'youtube',                     // 플랫폼 (YouTube)
        account_id: channel.id,                  // 채널 ID
        account_name: channel.snippet.title,     // 채널 이름
        profile_image_url: channel.snippet.thumbnails?.default?.url, // 채널 썸네일
        access_token: tokens.access_token,       // 액세스 토큰
        refresh_token: tokens.refresh_token,     // 리프레시 토큰 (장기 접근용)
        expires_at: tokens.expires_in           // 토큰 만료 시간
          ? new Date(Date.now() + tokens.expires_in * 1000) 
          : null
      })

    // 에러 처리: 데이터베이스 저장 실패
    if (dbError) {
      console.error('데이터베이스 오류:', dbError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=데이터베이스_저장_실패`)
    }

    // 성공 로그 기록
    console.log('YouTube 채널 연결 및 저장 완료:', channel.snippet.title)

    // 성공 시 대시보드로 리디렉션
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?success=youtube_connected`)

  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error('YouTube 연결 오류:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=서버_오류`)
  }
}