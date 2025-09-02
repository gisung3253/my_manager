import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Instagram 계정 연결을 위한 OAuth 인증 초기화 API
 * POST /api/connection/instagram
 * 
 * 요청 본문에 userId가 필요함
 * Instagram OAuth 2.0 인증 URL을 생성하여 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 사용자 ID 추출
    const { userId } = await request.json()
    
    // 사용자 ID 유효성 검사
    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 })
    }

    // 환경변수 확인
    if (!process.env.INSTAGRAM_APP_ID) {
      return NextResponse.json({ error: 'Instagram App ID가 설정되지 않았습니다' }, { status: 500 })
    }

    // OAuth state 생성 (CSRF 공격 방지)
    const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // 임시 state 저장 (10분 만료)
    const { error: stateError } = await supabase
      .from('temp_oauth_tokens')
      .insert({
        oauth_token: state, // state를 token 필드에 저장
        oauth_token_secret: 'instagram_oauth2', // Instagram은 OAuth 2.0이므로 secret 불필요
        user_id: userId,
        platform: 'instagram',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10분 후 만료
        created_at: new Date().toISOString()
      })

    if (stateError) {
      console.error('State 저장 실패:', stateError)
      return NextResponse.json({ error: '인증 상태 저장에 실패했습니다' }, { status: 500 })
    }

    // Instagram Business Login API 사용 (순수 Instagram 로그인)
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection/instagram/callback`,
      scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments', // 새로운 scope 값 (2025년 1월 27일부터 적용)
      response_type: 'code',
      state: state
    })

    const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`
    
    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('Instagram OAuth 초기화 오류:', error)
    return NextResponse.json({ error: 'OAuth 초기화에 실패했습니다' }, { status: 500 })
  }
}