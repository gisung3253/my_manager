import Header from '@/components/layout/main/Header'
import Hero from '@/components/layout/main/Hero'
import Pricing from '@/components/layout/main/Pricing'
import Footer from '@/components/layout/main/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Pricing />
      <Footer />
    </div>
  )
}