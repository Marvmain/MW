import Header from './components/Header'
import Hero from './components/Hero'
import CottagesSection from './components/CottagesSection'
import ActivitiesSection from './components/ActivitiesSection'
import AdminApp from './pages/AdminApp'

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <AdminApp />

  return (
    <div className="min-h-screen" id="top">
      <Header />
      <Hero />
      <CottagesSection />
      <ActivitiesSection />
    </div>
  )
}