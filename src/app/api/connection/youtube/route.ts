import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  
  if (!user_id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  
  const googleOAuthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  
  const params = {
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection/youtube/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
    access_type: 'offline',
    prompt: 'consent',
    state: user_id // 사용자 ID를 state로 전달
  }

  Object.entries(params).forEach(([key, value]) => {
    googleOAuthURL.searchParams.append(key, value)
  })

  return NextResponse.redirect(googleOAuthURL.toString())
}