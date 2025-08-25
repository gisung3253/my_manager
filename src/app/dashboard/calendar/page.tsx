export default function CalendarPage() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeks = [
    ['17', '18', '19', '20', '21', '22', '23'],
    ['24', '25', '26', '27', '28', '29', '30'],
    ['31', '1', '2', '3', '4', '5', '6'],
    ['7', '8', '9', '10', '11', '12', '13'],
  ]

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <div className="text-gray-500">Aug 17 - Aug 23, 2025</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-white rounded-lg border border-gray-200">
              <button className="px-4 py-2 bg-green-500 text-white rounded-l-lg">Week</button>
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-r-lg">Month</button>
            </div>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
              This week
            </button>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded">←</button>
              <button className="p-2 hover:bg-gray-100 rounded">→</button>
            </div>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {days.map((day, index) => (
              <div key={day} className="p-4 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                <div className="mb-2">{day}</div>
                <div className="text-lg">{weeks[0][index]}</div>
              </div>
            ))}
          </div>

          {/* 시간대별 그리드 */}
          <div className="grid grid-cols-7 min-h-96">
            {weeks[0].map((date, index) => (
              <div key={date} className="border-r border-gray-200 last:border-r-0 p-4 min-h-96">
                <div className="text-center text-gray-500 text-sm mb-4">
                  No posts for this day.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}