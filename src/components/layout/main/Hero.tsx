import Link from 'next/link'

export default function Hero() {
  return (
    <section className="px-6 py-32 max-w-7xl mx-auto">
      <div className="max-w-4xl">
        <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-8">
          우리는 콘텐츠를<br />
          <span className="text-slate-800">연결하는</span><br />
          사람들입니다.
        </h1>
        
        <div className="text-xl text-gray-600 mb-16 max-w-2xl leading-relaxed">
          Social Manager만의 자동화 기술로<br />
          모든 플랫폼을 하나로 연결합니다.<br />
          <br />
          콘텐츠 제작부터 배포, 분석까지<br />
          소셜미디어의 모든 과정에 함께합니다.
        </div>

        <Link href="/dashboard" className="inline-block bg-black text-white px-8 py-4 text-lg hover:bg-gray-800 transition-colors">
          무료로 시작하기 →
        </Link>
      </div>
    </section>
  )
}