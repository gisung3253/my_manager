interface LoginFooterProps {
  isLogin: boolean
}

export default function LoginFooter({ isLogin }: LoginFooterProps) {
  if (isLogin) return null // 로그인일 때는 약관 표시 안함

  return (
    <div className="text-center text-xs text-gray-500 pt-4">
      회원가입 시 <a href="#" className="text-black hover:underline">이용약관</a> 및{' '}
      <a href="#" className="text-black hover:underline">개인정보처리방침</a>에 동의합니다.
    </div>
  )
}