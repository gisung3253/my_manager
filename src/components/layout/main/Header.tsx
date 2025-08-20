import Link from 'next/link'

export default function Header() {
  return (
    <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
          <span className="text-white font-bold text-sm">SM</span>
        </div>
        <span className="text-xl font-bold text-black">Social Manager</span>
      </div>
      
      <div className="flex items-center space-x-8">
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-black transition-colors">기능</a>
          <a href="#pricing" className="text-gray-600 hover:text-black transition-colors">가격</a>
          <a href="#contact" className="text-gray-600 hover:text-black transition-colors">문의</a>
        </nav>
        <Link href="/login" className="bg-black text-white px-6 py-2 rounded-sm hover:bg-gray-800 transition-colors">
          로그인
        </Link>
      </div>
    </header>
  )
}