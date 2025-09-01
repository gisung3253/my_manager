'use client'

import { usePostCreation } from '../../context/PostCreationContext'

export default function TwitterSettings() {
  const { 
    platformSettings,
    updatePlatformSetting,
    getCharacterCount
  } = usePostCreation()
  
  const { hashtags } = platformSettings.twitter
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-3">🐦 Twitter 설정</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">해시태그</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => updatePlatformSetting('twitter', 'hashtags', e.target.value)}
            placeholder="#해시태그1 #해시태그2"
            className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-blue-600">해시태그는 공백으로 구분하세요</p>
            <span className={`text-xs ${getCharacterCount() > 280 ? 'text-red-500' : 'text-blue-600'}`}>
              {getCharacterCount()}/280
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}