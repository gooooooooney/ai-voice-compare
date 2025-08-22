import { Header } from '@/components/layout/Header'
import { TranscriptionTest } from '@/components/TranscriptionTest'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        <TranscriptionTest />
      </main>
    </div>
  )
}

export default App