export default function ConnectionsPage() {
  const platforms = [
    { name: 'Instagram', icon: '📷', connected: true, username: '@parkgisung' },
    { name: 'Twitter', icon: '🐦', connected: false, username: '' },
    { name: 'YouTube', icon: '📺', connected: false, username: '' },
    { name: 'TikTok', icon: '🎵', connected: false, username: '' },
    { name: 'Facebook', icon: '👍', connected: false, username: '' },
    { name: 'LinkedIn', icon: '💼', connected: false, username: '' },
    { name: 'Bluesky', icon: '🦋', connected: false, username: '' },
    { name: 'Threads', icon: '🧵', connected: false, username: '' },
    { name: 'Pinterest', icon: '📌', connected: false, username: '' },
  ]

  return (
    <div className="h-full p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Connected Accounts</h1>
        
        <div className="space-y-4">
          {platforms.map((platform, index) => (
            <div key={platform.name} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{platform.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{platform.name}</div>
                  {platform.connected && (
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <span>{platform.username}</span>
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {platform.connected && (
                  <button className="text-gray-500 hover:text-gray-700 text-sm">
                    Refresh Instagram
                  </button>
                )}
                <button 
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    platform.connected 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  }`}
                >
                  {platform.connected ? 'Disconnect' : `Connect ${platform.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}