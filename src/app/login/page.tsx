'use client'

import { useState } from 'react'
import LoginHeader from '@/components/layout/login/LoginHeader'
import LoginForm from '@/components/layout/login/LoginForm'
import LoginFooter from '@/components/layout/login/LoginFooter'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-white">
      <LoginHeader />
      
      <div className="flex items-center justify-center px-4 py-16">
        <LoginForm 
          isLogin={isLogin} 
          onToggle={() => setIsLogin(!isLogin)} 
        />
      </div>
      
      <div className="flex justify-center px-4 pb-16">
        <LoginFooter isLogin={isLogin} />
      </div>
    </div>
  )
}