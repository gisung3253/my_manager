'use client'

import { usePostCreation } from '../context/PostCreationContext'

export default function ActionButtons() {
  const { 
    postType,
    mainCaption,
    mediaFile,
    selectedAccounts,
    uploading,
    isScheduled,
    handleSubmit
  } = usePostCreation()
  
  const isSubmitDisabled = 
    (postType !== 'text' && !mediaFile) || 
    selectedAccounts.length === 0 || 
    uploading || 
    !mainCaption.trim()

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div></div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>{isScheduled ? '예약 중...' : '업로드 중...'}</span>
            </>
          ) : (
            <>
              <span>{isScheduled ? '⏰' : '✈️'}</span>
              <span>{isScheduled ? '게시물 예약하기' : '지금 게시하기'}</span>
            </>
          )}
        </button>
        
        <button 
          disabled={uploading}
          className="border border-gray-300 hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          📁 임시저장
        </button>
      </div>
    </div>
  )
}