import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 사용자의 연결된 소셜 미디어 계정 목록을 조회하는 API
 * GET /api/connections
 * 
 * 헤더에 x-user-id가 필요함
 */
export async function GET(request: NextRequest) {
  try {
    // 프론트엔드에서 전송한 헤더에서 사용자 ID 추출
    const userIdHeader = request.headers.get('x-user-id')
    
    // 사용자 ID가 없는 경우 인증 오류 반환
    if (!userIdHeader) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다' }, { status: 401 })
    }
    
    // 문자열 ID를 숫자로 변환
    const user_id = parseInt(userIdHeader)

    // Supabase에서 연결된 계정 목록 조회
    const { data: connectedAccounts, error } = await supabase
      .from('connected_accounts')  // connected_accounts 테이블 대상
      .select('*')                 // 모든 필드 선택
      .eq('user_id', user_id)      // 해당 사용자의 계정만 필터링
      .order('created_at', { ascending: false })  // 최신순 정렬

    // 데이터베이스 오류 처리
    if (error) {
      console.error('데이터베이스 오류:', error)
      return NextResponse.json({ error: '계정 목록을 가져오는데 실패했습니다' }, { status: 500 })
    }

    // 성공적으로 데이터 반환 (결과가 없으면 빈 배열)
    return NextResponse.json({ accounts: connectedAccounts || [] })

  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error('서버 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류가 발생했습니다' }, { status: 500 })
  }
}