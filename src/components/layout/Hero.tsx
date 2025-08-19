import Button from '../ui/Button'

export default function Hero() {
  return (
    <section className="px-6 py-20 text-center max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        모든 소셜미디어에 
        <span className="text-blue-600"> 한 번에 포스팅</span>
      </h1>
      
      <p className="text-xl text-gray-600 mb-8">
        30분이 걸리던 콘텐츠 배포를 30초로! 
        한국 크리에이터를 위한 가장 쉽고 저렴한 소셜미디어 관리 도구
      </p>

      <div className="flex items-center justify-center space-x-4">
        <Button variant="primary" size="lg">
          무료로 시작하기
        </Button>
        <Button variant="secondary" size="lg">
          데모 보기
        </Button>
      </div>
    </section>
  )
}