'use client'

import { usePostCreation } from '../../context/PostCreationContext'

export default function YoutubeSettings() {
  const { 
    platformSettings,
    updatePlatformSetting
  } = usePostCreation()
  
  const { title, description, privacy } = platformSettings.youtube
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-medium text-red-900 mb-3">📺 YouTube 설정</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">동영상 제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => updatePlatformSetting('youtube', 'title', e.target.value)}
            className="w-full p-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
            placeholder="동영상 제목 입력..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => updatePlatformSetting('youtube', 'description', e.target.value)}
            className="w-full p-2 border border-red-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
            placeholder="동영상 설명..."
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">공개 설정</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={privacy === 'public'}
                onChange={(e) => updatePlatformSetting('youtube', 'privacy', e.target.value)}
                className="w-4 h-4 text-red-600 border-red-300 focus:ring-red-500"
              />
              <span className="text-sm text-gray-900">🌍 공개 (누구나 시청 가능)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="privacy"
                value="unlisted"
                checked={privacy === 'unlisted'}
                onChange={(e) => updatePlatformSetting('youtube', 'privacy', e.target.value)}
                className="w-4 h-4 text-red-600 border-red-300 focus:ring-red-500"
              />
              <span className="text-sm text-gray-900">🔗 일부공개 (링크 있으면 시청 가능)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={privacy === 'private'}
                onChange={(e) => updatePlatformSetting('youtube', 'privacy', e.target.value)}
                className="w-4 h-4 text-red-600 border-red-300 focus:ring-red-500"
              />
              <span className="text-sm text-gray-900">🔒 비공개 (본인만 시청 가능)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}