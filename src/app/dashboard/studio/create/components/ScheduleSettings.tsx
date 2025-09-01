'use client'

import { usePostCreation } from '../context/PostCreationContext'

export default function ScheduleSettings() {
  const { 
    isScheduled,
    scheduledDate, setScheduledDate,
    scheduledTime, setScheduledTime
  } = usePostCreation()
  
  if (!isScheduled) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-3">⏰ 예약 설정</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">날짜</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">시간</label>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
      </div>
      
      {scheduledDate && scheduledTime && (
        <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <span>📅</span>
            <span className="text-sm font-medium">
              예약 시간: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                weekday: 'long'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}