export default function StudioPage() {
  const templates = [
    {
      title: 'AI UGC Video Creator',
      description: 'Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for product demos, testimonials, and viral marketing content.',
      badge: 'NEW',
      badgeColor: 'bg-green-500',
      status: 'AI-Powered',
      views: 'Infinite views',
      trending: 'SUPERHOT',
      icon: '🤖'
    },
    {
      title: '2×2 Grid Video',
      description: 'Create viral videos with this 4 image grid format (tested & proven to go viral)',
      badge: '🔒',
      badgeColor: 'bg-red-500',
      status: 'Trending',
      views: '20M+ views',
      trending: 'Trending',
      icon: '📱'
    },
    {
      title: 'Single Fade-in Video',
      description: 'Simple format with billions of views - use your imagination to make a viral banger (we will do the editing)',
      badge: '🔒',
      badgeColor: 'bg-red-500',
      status: 'Trending',
      views: '500M+ views',
      trending: 'Trending',
      icon: '🎬'
    },
    {
      title: 'AI UGC Creator',
      description: 'Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for product demos, testimonials, and viral marketing content.',
      badge: '🔒',
      badgeColor: 'bg-red-500',
      status: 'Trending',
      views: '10+ views',
      trending: 'Trending',
      icon: '🎥'
    }
  ]

  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Content Studio</h1>
        
        {/* 상단 추천 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                <span className="text-green-600 text-sm font-medium">AI-Powered</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">🤖 AI UGC Video Creator</h3>
              <p className="text-gray-600 mb-4">
                Create authentic UGC-style videos in seconds using our AI-powered templates. Perfect for product demos, testimonials, 
                and viral marketing content.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-600 font-medium">🔥 SUPERHOT</span>
                <span className="text-gray-500">♾️ Infinite views</span>
              </div>
            </div>
            <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold ml-6">
              Try AI UGC Creator →
            </button>
          </div>
        </div>

        {/* 템플릿 그리드 */}
        <div className="grid md:grid-cols-3 gap-6">
          {templates.slice(1).map((template, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 relative">
              {/* 잠금 아이콘 */}
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-500">🔒</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl mb-3">{template.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded">
                      🔥 {template.trending}
                    </span>
                    <span className="text-gray-500 text-xs">📊 {template.views}</span>
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-medium">
                Upgrade to Use
              </button>
              
              {/* 더보기 버튼 */}
              <button className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-gray-600">
                <span className="text-lg">👁️</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}