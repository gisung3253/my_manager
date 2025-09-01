'use client'

import { usePostCreation } from '../context/PostCreationContext'

export default function UploadProgress() {
  const { uploading, uploadProgress } = usePostCreation()
  
  if (!uploading) return null
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-2">
        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="text-blue-800 font-medium">업로드 중...</span>
        <span className="text-blue-600 text-sm">{uploadProgress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        ></div>
      </div>
    </div>
  )
}