export default function DraftsPage() {
  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Drafts</h1>
        
        {/* 빈 상태 */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-6">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">No draft posts</h3>
          <p className="text-gray-600 mb-6">
            Draft posts appear here when you create a scheduled post but don't set a schedule time, 
            or when you duplicate a post.
          </p>
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600">
            Create Post
          </button>
        </div>
      </div>
    </div>
  )
}