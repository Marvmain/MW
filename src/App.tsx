import { useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import { supabase } from './lib/supabase'

export default function App() {
  useEffect(() => {
    async function test() {
      const read = await supabase.from('cottages').select('name, is_active')
      console.log('READ:', read.data, read.error)
      const write = await supabase.from('cottages').insert({ name: 'HACK', price: 1 })
      console.log('WRITE:', write.error?.message)
    }
    test()
  }, [])

  return (
    <div className="min-h-screen" id="top">
      <Header />
      <Hero />
    </div>
  )
}