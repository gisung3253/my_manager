import Header from '@/components/layout/Header'
import Hero from '@/components/layout/Hero'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <Hero />
      
      {/* 간단한 특징 */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="text-lg font-semibold mb-2">시간 절약</h3>
            <p className="text-gray-600">한 번에 모든 플랫폼 포스팅</p>
          </div>
          
          <div className="p-6">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold mb-2">성장 가속화</h3>
            <p className="text-gray-600">일관된 콘텐츠로 팔로워 증가</p>
          </div>
          
          <div className="p-6">
            <div className="text-3xl mb-3">🇰🇷</div>
            <h3 className="text-lg font-semibold mb-2">한국 특화</h3>
            <p className="text-gray-600">네이버 블로그, 카페까지</p>
          </div>
        </div>
      </section>
    </main>
  )
}