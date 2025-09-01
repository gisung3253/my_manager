'use client'

import { usePostCreation } from '../context/PostCreationContext'

export default function ContentInput() {
  const { 
    postType,
    mainCaption, setMainCaption,
    mediaFile,
    handleFileUpload,
    handleDragOver,
    handleDrop,
    hasTwitterAccount,
    getCharacterCount
  } = usePostCreation()

  return (
    <div className="space-y-6">
      {postType === 'text' ? (
        // 텍스트 포스트 UI
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">✍️ 텍스트 게시물</h3>
            {hasTwitterAccount() && (
              <div className="text-sm text-gray-600">
                <span className={`${getCharacterCount() > 280 ? 'text-red-500 font-medium' : 'text-blue-500'}`}>
                  {getCharacterCount()}/280
                </span>
              </div>
            )}
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <textarea
              value={mainCaption}
              onChange={(e) => setMainCaption(e.target.value)}
              placeholder="무슨 생각을 하고 계신가요?"
              className="w-full border-0 resize-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 text-lg"
              rows={6}
              style={{ minHeight: '150px' }}
            />
            
            {hasTwitterAccount() && getCharacterCount() > 280 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ⚠️ Twitter는 280자 제한이 있습니다. 텍스트를 줄이는 것이 좋습니다.
              </div>
            )}
          </div>
        </div>
      ) : (
        // 이미지/비디오 포스트 UI
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {postType === 'video' ? '🎥 동영상 게시물' : '📸 이미지 게시물'}
            </h3>
            
            {/* 파일 업로드 영역 */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
            >
              <div className="text-green-500 text-6xl mb-4">
                {postType === 'video' ? '🎬' : '🖼️'}
              </div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">
                클릭하여 업로드 또는 드래그 앤 드롭
              </h4>
              <p className="text-gray-500 mb-4">
                {postType === 'video' 
                  ? 'MP4, MOV, AVI 파일 지원' 
                  : 'JPG, PNG, GIF 파일 지원'
                }
              </p>
              
              <input
                type="file"
                accept={postType === 'video' ? 'video/*' : 'image/*'}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                📎 파일 선택
              </label>
              
              {/* 선택된 파일 정보 */}
              {mediaFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✅</span>
                    <span className="text-sm text-green-800 font-medium">{mediaFile.name}</span>
                    <span className="text-xs text-green-600">
                      ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 미디어 캡션 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">캡션</label>
              {hasTwitterAccount() && (
                <div className="text-sm text-gray-600">
                  <span className={`${getCharacterCount() > 280 ? 'text-red-500 font-medium' : 'text-blue-500'}`}>
                    {getCharacterCount()}/280
                  </span>
                </div>
              )}
            </div>
            <textarea
              value={mainCaption}
              onChange={(e) => setMainCaption(e.target.value)}
              placeholder="게시물에 대한 설명을 입력하세요..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
              rows={4}
            />
            
            {hasTwitterAccount() && getCharacterCount() > 280 && (
              <div className="mt-1 text-sm text-red-500">
                Twitter는 280자 제한이 있습니다
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}