import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    // 구글 OAuth URL로 리디렉션
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google`
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `access_type=offline`

    return NextResponse.redirect(googleAuthUrl)
  }

  try {
    // 구글에서 액세스 토큰 받기
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
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google`,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      throw new Error('토큰을 받지 못했습니다')
    }

    // 구글에서 사용자 정보 받기
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const googleUser = await userResponse.json()

    console.log('구글 사용자 정보:', googleUser) // 디버깅

    // 기존 사용자 확인
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single()

    console.log('기존 사용자 조회:', existingUser, selectError) // 디버깅

    let user

    if (existingUser) {
      // 기존 사용자 - 구글 정보 업데이트
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          google_id: googleUser.id,
          auth_provider: 'google',
          name: googleUser.name
        })
        .eq('email', googleUser.email)
        .select()
        .single()

      console.log('사용자 업데이트:', updatedUser, updateError) // 디버깅
      user = updatedUser
    } else {
      // 새 사용자 생성
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
          auth_provider: 'google',
          password: null
        })
        .select()
        .single()

      console.log('새 사용자 생성:', newUser, insertError) // 디버깅
      user = newUser
    }

    if (!user) {
      throw new Error('사용자 생성/업데이트 실패')
    }

    // 로그인 성공 페이지로 리디렉션 (사용자 정보를 쿼리로 전달)
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name
    }))

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login/success?user=${userData}`)

  } catch (error) {
    console.error('구글 로그인 오류:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=google_login_failed`)
  }
}