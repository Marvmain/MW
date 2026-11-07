import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import AvailabilityBar from './components/AvailabilityBar'
import CottagesSection from './components/CottagesSection'
import ActivitiesSection from './components/ActivitiesSection'
import ProcessSection from './components/ProcessSection'
import LocationSection from './components/LocationSection'
import Footer from './components/Footer'
import TrackModal from './components/TrackModal'
import AdminApp from './pages/AdminApp'
import VideoSection from './components/VideoSection'


import type { AvailabilityResult } from './types'

function GuestSite() {
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [trackOpen, setTrackOpen] = useState(false)

  return (
    <div className="min-h-screen" id="top">
      <Header onTrack={() => setTrackOpen(true)} />
      <Hero />
      <AvailabilityBar onResult={setAvailability} refreshSignal={refresh} />
      <CottagesSection availability={availability} onBooked={() => setRefresh((n) => n + 1)} />
      <ActivitiesSection />
      <VideoSection />
      <ProcessSection />
      <LocationSection />
      <Footer />
      {trackOpen && <TrackModal onClose={() => setTrackOpen(false)} />}
    </div>
  )
}

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <AdminApp />
  return <GuestSite />
}