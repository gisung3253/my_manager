
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OAuth } from 'oauth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oauth_token = searchParams.get('oauth_token')
    const oauth_verifier = searchParams.get('oauth_verifier')
    const state = searchParams.get('state')
    const denied = searchParams.get('denied')

    if (denied) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=access_denied`)
    }

    if (!oauth_token || !oauth_verifier) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=no_token`)
    }

    // OAuth 1.0a에서는 state를 사용하지 않으므로 다른 방법 필요
    // 임시로 하드코딩된 값 사용 (실제로는 세션이나 임시 저장소 필요)
    const userId = 2 // 현재 사용자 ID (실제로는 세션에서 가져와야 함)
    const oauthTokenSecret = 'temp_secret' // request token에서 저장된 secret

    // OAuth 1.0a instance
    const oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      process.env.TWITTER_API_KEY!,
      process.env.TWITTER_API_SECRET!,
      '1.0A',
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/connection/twitter/callback`,
      'HMAC-SHA1'
    )

    return new Promise((resolve, reject) => {
      // Access token 교환
      oauth.getOAuthAccessToken(
        oauth_token,
        oauthTokenSecret,
        oauth_verifier,
        async (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
          if (error) {
            console.error('OAuth access token error:', error)
            resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=token_failed`))
            return
          }

          try {
            // 사용자 정보 가져오기 (OAuth 1.0a로)
            oauth.get(
              'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
              oauthAccessToken,
              oauthAccessTokenSecret,
              async (error, data, response) => {
                if (error) {
                  console.error('Failed to get user data:', error)
                  resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=user_data_failed`))
                  return
                }

                try {
                  const user = JSON.parse(data as string)

                  // DB에 저장 (OAuth 1.0a 토큰 포함)
                  const { error: dbError } = await supabase
                    .from('connected_accounts')
                    .insert({
                      user_id: userId,
                      platform: 'twitter',
                      account_id: user.id_str,
                      account_name: user.name,
                      username: user.screen_name,
                      profile_image_url: user.profile_image_url_https,
                      access_token: oauthAccessToken,
                      access_token_secret: oauthAccessTokenSecret,
                      refresh_token: null,
                      expires_at: null
                    })

                  if (dbError) {
                    console.error('Database error:', dbError)
                    resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=db_save_failed`))
                    return
                  }

                  // 임시 토큰 삭제
                  await supabase
                    .from('temp_oauth_tokens')
                    .delete()
                    .eq('oauth_token', oauth_token)

                  console.log('Twitter account connected:', user.screen_name)
                  resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?success=twitter_connected`))

                } catch (parseError) {
                  console.error('Failed to parse user data:', parseError)
                  resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=parse_failed`))
                }
              }
            )

          } catch (userError) {
            console.error('User info fetch error:', userError)
            resolve(NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=user_fetch_failed`))
          }
        }
      )
    })

  } catch (error) {
    console.error('Twitter callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/connections?error=server_error`)
  }
}