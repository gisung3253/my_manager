export default function BulkToolsPage() {
  return (
    <div className="h-full p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Bulk Tools</h1>
        
        {/* 도구 그리드 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* CSV 업로드 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">CSV 일괄 업로드</h3>
            <p className="text-gray-600 mb-6">
              CSV 파일로 여러 포스트를 한 번에 업로드하고 예약하세요
            </p>
            <button className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium">
              CSV 파일 선택
            </button>
          </div>

          {/* 이미지 일괄 처리 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">이미지 일괄 처리</h3>
            <p className="text-gray-600 mb-6">
              여러 이미지를 한 번에 업로드하고 자동으로 포스트 생성
            </p>
            <button className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 font-medium">
              이미지 선택
            </button>
          </div>

          {/* 동영상 일괄 처리 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">동영상 일괄 처리</h3>
            <p className="text-gray-600 mb-6">
              여러 동영상을 한 번에 업로드하고 플랫폼별 최적화
            </p>
            <button className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-medium">
              동영상 선택
            </button>
          </div>

          {/* 해시태그 일괄 생성 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">#️⃣</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">해시태그 일괄 생성</h3>
            <p className="text-gray-600 mb-6">
              AI로 여러 포스트의 해시태그를 한 번에 생성
            </p>
            <button className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium">
              AI 해시태그 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}