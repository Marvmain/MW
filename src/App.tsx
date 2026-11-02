import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import AvailabilityBar from './components/AvailabilityBar'
import CottagesSection from './components/CottagesSection'
import ActivitiesSection from './components/ActivitiesSection'
import AdminApp from './pages/AdminApp'
import type { AvailabilityResult } from './types'

function GuestSite() {
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="min-h-screen" id="top">
      <Header />
      <Hero />
      <AvailabilityBar onResult={setAvailability} refreshSignal={refresh} />
      <CottagesSection availability={availability} onBooked={() => setRefresh((n) => n + 1)} />
      <ActivitiesSection />
    </div>
  )
}

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <AdminApp />
  return <GuestSite />
}