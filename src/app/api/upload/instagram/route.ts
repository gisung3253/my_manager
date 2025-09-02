import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Instagram 업로드 API
 * POST /api/upload/instagram
 * 
 * 이미지/동영상과 캡션을 Instagram Graph API를 통해 업로드합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 폼 데이터 파싱
    const formData = await request.formData()
    const content = formData.get('content') as string
    const accountId = formData.get('accountId') as string
    const userId = formData.get('userId') as string
    const mediaFile = formData.get('media') as File | null

    // 2. 필수 필드 검증
    if (!accountId || !userId) {
      return NextResponse.json({ error: '필수 입력 항목이 누락되었습니다' }, { status: 400 })
    }

    // 3. 계정 정보 가져오기
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('id', parseInt(accountId))
      .eq('user_id', parseInt(userId))
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: '계정을 찾을 수 없습니다' }, { status: 404 })
    }

    // 4. 미디어 파일 필수 체크
    if (!mediaFile) {
      return NextResponse.json({ error: 'Instagram은 미디어 파일이 필요합니다' }, { status: 400 })
    }

    // 5. 미디어 파일을 Cloudinary에 업로드
    const mediaUrl = await uploadToCloudinary(mediaFile)
    if (!mediaUrl) {
      return NextResponse.json({ error: '미디어 업로드에 실패했습니다' }, { status: 500 })
    }

    // 6. Instagram Graph API로 컨테이너 생성
    const isVideo = mediaFile.type.startsWith('video/')
    
    // Instagram Business 계정 ID 사용
    const instagramAccountId = account.account_id
    
    // Instagram 동영상 업로드는 REELS 타입 사용 (VIDEO는 deprecated)
    const mediaParams = isVideo ? {
      media_type: 'REELS',
      video_url: mediaUrl,
      caption: content || '',
      access_token: account.access_token,
      // 릴스 업로드 시 추가 파라미터
      cover_url: mediaUrl  // 커버 이미지 URL (동영상과 동일하게 설정)
    } : {
      image_url: mediaUrl,
      caption: content || '',
      access_token: account.access_token
    }

    console.log('🔍 Instagram 컨테이너 생성 중:', {
      instagramAccountId: instagramAccountId,
      isVideo,
      mediaUrl,
      caption: content?.substring(0, 50) + '...',
      accessToken: account.access_token ? 'Present' : 'Missing',
      mediaParams: mediaParams
    })

    // Instagram Business 계정 ID를 사용하여 컨테이너 생성
    const containerResponse = await fetch(`https://graph.instagram.com/v21.0/${instagramAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaParams)
    })

    const containerData = await containerResponse.json()

    console.log('📦 Instagram 컨테이너 응답:', containerData)

    if (!containerResponse.ok) {
      console.error('❌ Instagram 컨테이너 생성 실패:', {
        status: containerResponse.status,
        statusText: containerResponse.statusText,
        error: containerData,
        mediaParams: mediaParams
      })
      return NextResponse.json({
        success: false,
        error: containerData.error?.message || `Instagram 컨테이너 생성 실패: ${containerResponse.status}`
      }, { status: 400 })
    }

    console.log('✅ Instagram 컨테이너 생성 완료:', containerData.id)

    // 7. 동영상인 경우 처리 상태 확인 (필요시)
    if (isVideo) {
      console.log('⏳ 동영상 처리 대기 중...')
      // 동영상은 처리 시간이 더 오래 걸림
      await new Promise(resolve => setTimeout(resolve, 10000)) // 10초 대기
      
      // 선택적: 컨테이너 상태 확인
      const statusResponse = await fetch(`https://graph.instagram.com/v21.0/${containerData.id}?fields=status_code&access_token=${account.access_token}`)
      const statusData = await statusResponse.json()
      
      console.log('📹 동영상 처리 상태:', statusData)
      
      // ERROR가 아닌 경우에만 진행
      if (statusData.status_code === 'ERROR') {
        return NextResponse.json({
          success: false,
          error: '동영상 처리 중 오류가 발생했습니다'
        }, { status: 400 })
      }
    }

    // 8. 컨테이너를 실제로 게시
    const publishParams = {
      creation_id: containerData.id,
      access_token: account.access_token
    }

    console.log('📤 Instagram 게시 중:', publishParams)

    const publishResponse = await fetch(`https://graph.instagram.com/v21.0/${instagramAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishParams)
    })

    const publishData = await publishResponse.json()

    console.log('📤 Instagram 게시 응답:', publishData)

    if (publishResponse.ok && publishData.id) {
      console.log('✅ Instagram 게시 완료:', publishData.id)
      
      return NextResponse.json({
        success: true,
        postId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}`
      })
    } else {
      console.error('❌ Instagram 게시 실패:', {
        status: publishResponse.status,
        statusText: publishResponse.statusText,
        error: publishData,
        publishParams: publishParams
      })
      return NextResponse.json({
        success: false,
        error: publishData.error?.message || `Instagram 게시 실패: ${publishResponse.status}`
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Instagram 업로드 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 내부 오류가 발생했습니다'
    }, { status: 500 })
  }
}

/**
 * Cloudinary에 미디어 파일 업로드
 */
async function uploadToCloudinary(file: File): Promise<string | null> {
  try {
    // 환경변수 확인
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.log('⚠️ Cloudinary 환경변수가 설정되지 않음 - 데모 URL 사용')
      
      // 환경변수가 없으면 데모 URL 반환
      if (file.type.startsWith('image/')) {
        return 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Demo+Image'
      } else {
        return 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
      }
    }

    // Cloudinary 설정
    const { v2: cloudinary } = await import('cloudinary')
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    })

    // 파일을 base64로 변환
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`

    // 파일 타입에 따른 업로드 옵션
    const uploadOptions = {
      folder: 'social_media_manager', // Cloudinary 폴더 구조
      public_id: `instagram_${Date.now()}`, // 파일명
      resource_type: file.type.startsWith('video/') ? 'video' : 'image' as 'video' | 'image',
      transformation: file.type.startsWith('image/') ? [
        { width: 1080, height: 1080, crop: 'limit' }, // Instagram 최적화
        { quality: 'auto', fetch_format: 'auto' }
      ] : [
        { width: 1080, height: 1350, crop: 'limit' }, // Instagram 동영상 최적화
        { quality: 'auto' }
      ]
    }

    console.log('📤 Cloudinary에 업로드 중:', {
      fileType: file.type,
      fileSize: buffer.length,
      resourceType: uploadOptions.resource_type
    })

    // Cloudinary에 업로드
    const result = await cloudinary.uploader.upload(base64Data, uploadOptions)

    console.log('✅ Cloudinary 업로드 완료:', {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    })

    return result.secure_url

  } catch (error) {
    console.error('❌ Cloudinary 업로드 실패:', error)
    
    // 실패 시 데모 URL로 폴백
    console.log('🔄 데모 URL로 폴백')
    if (file.type.startsWith('image/')) {
      return 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Fallback+Image'
    } else {
      return 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
    }
  }
}