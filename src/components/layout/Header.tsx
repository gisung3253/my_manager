import Link from 'next/link'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

export default function Header() {
  return (
    <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
      <Logo />
      
      <div className="flex items-center space-x-4">
        <Link href="/login">
          <Button variant="secondary" size="sm">
            로그인
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="primary" size="sm">
            시작하기
          </Button>
        </Link>
      </div>
    </header>
  )
}