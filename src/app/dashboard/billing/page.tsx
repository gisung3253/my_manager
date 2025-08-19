export default function BillingPage() {
  return (
    <div className="h-full p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">청구</h1>
        
        <div className="text-gray-500 mb-8">
          구독, 결제 방법 및 청구 정보를 관리하세요
        </div>

        {/* 현재 계획 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">📋 현재 계획</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              유료!
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">스타터 플랜</span>
              <span className="font-semibold">월 9,900원</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">📅 결제 종료</span>
              <span className="text-gray-900">2025년 8월 27일</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">💰 청구 월 9,900원</span>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-yellow-800 text-sm">
                💡 무료 체험을 하지마니다. 체험 기간은 2025년 8월 27일에 종료됩니다. 그 이후에는 월 9,900원이 청구됩니다.
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900">
                현영 계획
              </button>
              <button className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg">
                구독 설치 중싱
              </button>
              <button className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg">
                구독 취소
              </button>
            </div>
          </div>
        </div>

        {/* Stripe 결제 포털 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-xl">💳</span>
            <span className="font-medium">Stripe 청구 포털</span>
            <span className="text-gray-400 text-sm">🔗</span>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            결제 내역, 청구서를 보거나 결제 방법을 변경하세요.
          </p>
          
          <button className="text-blue-600 hover:text-blue-800 text-sm">
            결제 포털 열기 →
          </button>
        </div>
      </div>
    </div>
  )
}