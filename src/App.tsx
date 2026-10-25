import Header from './components/Header'
import Hero from './components/Hero'
import AdminApp from './pages/AdminApp'

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <AdminApp />

  return (
    <div className="min-h-screen" id="top">
      <Header />
      <Hero />
    </div>
  )
}