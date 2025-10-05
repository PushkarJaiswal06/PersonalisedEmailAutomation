import { useState } from 'react'
import EmailUploader from './components/EmailUploader'
import CampaignHistory from './components/CampaignHistory'
import { Mail } from 'lucide-react'

function App() {
  const [refreshHistory, setRefreshHistory] = useState(0)

  const handleCampaignComplete = () => {
    setRefreshHistory(prev => prev + 1)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-in">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Mail className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            Email Automation System
          </h1>
          <p className="text-xl text-white/90">
            Send bulk emails fast and efficiently
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Uploader - Takes 2/3 of space on large screens */}
          <div className="lg:col-span-2">
            <EmailUploader onCampaignComplete={handleCampaignComplete} />
          </div>

          {/* Campaign History - Takes 1/3 of space on large screens */}
          <div className="lg:col-span-1">
            <CampaignHistory refreshTrigger={refreshHistory} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/70">
          <p>Built with MERN Stack + Socket.IO for real-time updates</p>
        </div>
      </div>
    </div>
  )
}

export default App
