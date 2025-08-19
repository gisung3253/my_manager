'use client'

import { useState } from 'react'

export default function DashboardPage() {
  const [selectedPostType, setSelectedPostType] = useState<'text' | 'image' | 'video'>('text')

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">새 포스트 만들기</h1>

        {/* 포스트 타입 선택 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Text Post */}
          <button
            onClick={() => setSelectedPostType('text')}
            className={`p-8 border-2 rounded-xl text-center transition-all hover:border-blue-300 ${
              selectedPostType === 'text' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-4">Text Post</h3>
            <div className="flex justify-center space-x-1 mb-4">
              {['📘', '🐦', '📷', '🎵', '📘'].map((icon, i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded text-xs flex items-center justify-center">
                  {icon}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">간단한 텍스트 포스트</p>
          </button>

          {/* Image Post */}
          <button
            onClick={() => setSelectedPostType('image')}
            className={`p-8 border-2 rounded-xl text-center transition-all hover:border-blue-300 ${
              selectedPostType === 'image' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-6xl mb-4">🖼️</div>
            <h3 className="text-xl font-semibold mb-4">Image Post</h3>
            <div className="flex justify-center space-x-1 mb-4">
              {['📘', '🐦', '📷', '🎵', '📘', '🟦', '📌', '🎬'].map((icon, i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded text-xs flex items-center justify-center">
                  {icon}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">이미지와 함께하는 포스트</p>
          </button>

          {/* Video Post */}
          <button
            onClick={() => setSelectedPostType('video')}
            className={`p-8 border-2 rounded-xl text-center transition-all hover:border-blue-300 ${
              selectedPostType === 'video' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold mb-4">Video Post</h3>
            <div className="flex justify-center space-x-1 mb-4">
              {['📘', '🐦', '📷', '🎵', '📘', '🟦', '📌', '🎬', '📺'].map((icon, i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded text-xs flex items-center justify-center">
                  {icon}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">동영상 포스트</p>
          </button>
        </div>

        {/* 하단 안내 */}
        <div className="text-center text-gray-600">
          <p className="text-sm">📱 계정을 더 연결하려면 <span className="text-green-600 cursor-pointer hover:underline">여기를 클릭하세요</span></p>
        </div>
      </div>
    </div>
  )
}