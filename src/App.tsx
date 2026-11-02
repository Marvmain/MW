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

  return (
    <div className="min-h-screen" id="top">
      <Header />
      <Hero />
      <AvailabilityBar onResult={setAvailability} />
      <CottagesSection availability={availability} />
      <ActivitiesSection />
    </div>
  )
}

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <AdminApp />
  return <GuestSite />
}