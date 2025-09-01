'use client'

import { usePostCreation } from '../../context/PostCreationContext'

export default function InstagramSettings() {
  const { 
    platformSettings,
    updatePlatformSetting,
    postType
  } = usePostCreation()
  
  const { altText, location } = platformSettings.instagram
  
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h4 className="font-medium text-purple-900 mb-3">📸 Instagram 설정</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">대체 텍스트</label>
          <textarea
            value={altText}
            onChange={(e) => updatePlatformSetting('instagram', 'altText', e.target.value)}
            placeholder="접근성을 위해 이미지를 설명하세요..."
            className="w-full p-2 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">위치</label>
          <input
            type="text"
            value={location}
            onChange={(e) => updatePlatformSetting('instagram', 'location', e.target.value)}
            placeholder="위치 추가..."
            className="w-full p-2 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  )
}