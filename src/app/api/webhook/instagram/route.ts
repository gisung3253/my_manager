import { NextRequest, NextResponse } from 'next/server'

/**
 * Instagram Webhook API
 * GET /api/webhook/instagram - Webhook 검증
 * POST /api/webhook/instagram - Webhook 이벤트 수신
 */

const WEBHOOK_VERIFY_TOKEN = 'instagram_webhook_token_2024'

// GET: Webhook 검증 (Meta에서 호출)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('📋 Webhook 검증 요청:', { mode, token, challenge })

    // 검증 토큰 확인
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook 검증 성공')
      return new NextResponse(challenge)
    } else {
      console.error('❌ Webhook 검증 실패 - 토큰 불일치')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch (error) {
    console.error('Webhook 검증 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Webhook 이벤트 수신
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📨 Instagram Webhook 이벤트 수신:', JSON.stringify(body, null, 2))

    // 여기서 필요한 이벤트 처리 로직 추가
    // 예: 댓글, 메시지, 멘션 등

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook 이벤트 처리 오류:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}