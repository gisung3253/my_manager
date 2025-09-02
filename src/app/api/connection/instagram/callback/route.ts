import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Instagram OAuth 인증 콜백 처리 API
 * GET /api/connection/instagram/callback
 * 
 * Instagram OAuth 인증 후 리디렉션되는 엔드포인트
 * 인증 코드를 액세스 토큰으로 교환하고 Instagram 계정 정보를 가져와 저장합니다
 */
export async function GET(request: NextRequest) {
  try {
    // 1. URL 파라미터 추출
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')           // OAuth 인증 코드
    const state = searchParams.get('state')         // CSRF 방지 상태값
    const error = searchParams.get('error')         // 에러 코드
    const errorDescription = searchParams.get('error_description') // 에러 설명

    // 에러 처리: 사용자가 권한 부여를 거부한 경우
    if (error) {
      console.error('Instagram OAuth 에러:', error, errorDescription)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=instagram_auth_failed`)
    }

    // 에러 처리: 인증 코드 또는 state가 없는 경우
    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=missing_auth_params`)
    }

    // 2. 저장된 state 검증
    const { data: stateData, error: stateError } = await supabase
      .from('temp_oauth_tokens')
      .select('*')
      .eq('oauth_token', state)
      .eq('platform', 'instagram')
      .single()

    if (stateError || !stateData) {
      console.error('State 검증 실패:', stateError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=invalid_state`)
    }

    const userId = stateData.user_id

    // 3. Instagram Business API로 토큰 교환
    const tokenParams = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection/instagram/callback`,
      code: code
    })

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    })
    const tokenData = await tokenResponse.json()
 
    console.log('🔍 토큰 교환 응답:', tokenData)

    if (!tokenResponse.ok) {
      console.error('토큰 교환 실패:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=token_exchange_failed`)
    }

    // 공식 API 응답 형식에 맞게 수정
    const accessTokenData = tokenData.data?.[0] || tokenData
    const accessToken = accessTokenData.access_token 
    const instagramUserId = accessTokenData.user_id

    if (!accessToken || !instagramUserId) {
      console.error('토큰 또는 사용자 ID가 없음:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=invalid_token_response`)
    }

    // 4. Long-lived token으로 교환
    const longTokenParams = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      access_token: accessToken
    })

    const longTokenResponse = await fetch(`https://graph.instagram.com/access_token?${longTokenParams.toString()}`)
    const longTokenData = await longTokenResponse.json()

    console.log('🔍 Long-lived 토큰 교환 응답:', longTokenData)

    const finalAccessToken = longTokenData.access_token || accessToken
    const expiresIn = longTokenData.expires_in || 3600

    // 5. Instagram Business 계정 정보 가져오기
    const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${finalAccessToken}`)
    const profileData = await profileResponse.json()

    console.log('🔍 프로필 정보:', profileData)

    if (!profileResponse.ok) {
      console.error('Instagram 프로필 정보 가져오기 실패:', profileData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=profile_fetch_failed`)
    }

    // 7. 데이터베이스에 연결 정보 저장
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString()

    const { error: dbError } = await supabase
      .from('connected_accounts')
      .insert({
        user_id: userId,
        platform: 'instagram',
        account_id: profileData.id,
        account_name: profileData.username,
        username: profileData.username,
        profile_image_url: null, // Instagram Business API는 프로필 이미지 제공 안함 (별도 요청 필요)
        access_token: finalAccessToken,
        access_token_secret: null, // OAuth 2.0에서는 사용 안함
        refresh_token: null, // Instagram Business 토큰
        expires_at: expiresAt,
        account_type: profileData.account_type || 'BUSINESS',
        media_count: profileData.media_count || 0,
        followers_count: 0 // 별도 API 호출 필요
      })

    if (dbError) {
      console.error('데이터베이스 저장 실패:', dbError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=database_save_failed`)
    }

    // 7. 임시 state 삭제
    await supabase
      .from('temp_oauth_tokens')
      .delete()
      .eq('oauth_token', state)

    // 8. 성공 로그 기록 및 리디렉션
    console.log('Instagram 계정 연결 완료:', profileData.username)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?success=instagram_connected`)

  } catch (error) {
    console.error('Instagram 콜백 오류:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=callback_error`)
  }
}