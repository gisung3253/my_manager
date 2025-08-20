import Link from 'next/link'

export default function LoginHeader() {
  return (
    <header className="px-6 py-6 flex items-center justify-center max-w-7xl mx-auto">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
          <span className="text-white font-bold text-sm">SM</span>
        </div>
        <span className="text-xl font-bold text-black">Social Manager</span>
      </Link>
    </header>
  )
}