export default function Footer() {
  return (
    <footer className="px-6 py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          <span className="text-xl font-bold">Social Manager</span>
        </div>
        
        <p className="text-gray-600 mb-6">
          한국 크리에이터를 위한 소셜미디어 관리 도구
        </p>
        
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
          <a href="/privacy" className="hover:text-black transition-colors">개인정보처리방침</a>
          <a href="/terms" className="hover:text-black transition-colors">이용약관</a>
          <a href="/contact" className="hover:text-black transition-colors">문의하기</a>
        </div>
      </div>
    </footer>
  )
}