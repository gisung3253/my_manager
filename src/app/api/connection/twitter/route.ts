import { NextRequest, NextResponse } from 'next/server'
import { OAuth } from 'oauth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Twitter OAuth 1.0a flow
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
      oauth.getOAuthRequestToken(async (error, oauthToken, oauthTokenSecret, results) => {
        if (error) {
          console.error('OAuth request token error:', error)
          resolve(NextResponse.json({ error: 'OAuth initialization failed' }, { status: 500 }))
          return
        }

        // Store the request token secret temporarily in database
        const { error: insertError } = await supabase
          .from('temp_oauth_tokens')
          .insert({
            oauth_token: oauthToken,
            oauth_token_secret: oauthTokenSecret,
            user_id: userId,
            created_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Failed to store temp token:', insertError)
          resolve(NextResponse.json({ error: 'Failed to store temporary token' }, { status: 500 }))
          return
        }

        const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`
        resolve(NextResponse.json({ authUrl }))
      })
    })

  } catch (error) {
    console.error('Twitter OAuth init error:', error)
    return NextResponse.json({ error: 'OAuth initialization failed' }, { status: 500 })
  }
}