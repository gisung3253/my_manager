import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 연결된 소셜 미디어 계정 연결을 해제하는 API
 * DELETE /api/connections/disconnect
 * 
 * 요청 본문에 accountId가 필요함
 */
export async function DELETE(request: NextRequest) {
  try {
    // 요청 본문에서 계정 ID 추출
    const { accountId } = await request.json()

    // 계정 ID 유효성 검사
    if (!accountId) {
      return NextResponse.json({ error: '계정 ID가 필요합니다' }, { status: 400 })
    }

    // TODO: 사용자가 이 계정의 소유자인지 확인 로직 추가 필요
    
    // Supabase에서 해당 계정 연결 정보 삭제
    const { error } = await supabase
      .from('connected_accounts')  // connected_accounts 테이블 대상
      .delete()                    // 레코드 삭제
      .eq('id', accountId)         // 해당 ID를 가진 계정만 삭제

    // 데이터베이스 오류 처리
    if (error) {
      console.error('데이터베이스 오류:', error)
      return NextResponse.json({ error: '계정 연결 해제에 실패했습니다' }, { status: 500 })
    }

    // 성공적으로 계정 연결 해제
    return NextResponse.json({ success: true })

  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error('서버 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류가 발생했습니다' }, { status: 500 })
  }
}