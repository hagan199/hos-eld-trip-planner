import React, { useState } from 'react'
import { planTrip } from './api'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import DailyLogRenderer from './components/DailyLogRenderer'
import TripSummary from './components/TripSummary'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [requestData, setRequestData] = useState(null)
  const [activeTab, setActiveTab] = useState('map')
  const [error, setError] = useState(null)

  async function handleSubmit(formData) {
    setLoading(true)
    setError(null)
    setRequestData(formData)
    try {
      if (!formData.start.lat || !formData.start.lng) {
        throw new Error('Please enter start location coordinates')
      }
      if (!formData.pickup.lat || !formData.pickup.lng) {
        throw new Error('Please enter pickup location coordinates')
      }
      if (!formData.dropoff.lat || !formData.dropoff.lng) {
        throw new Error('Please enter dropoff location coordinates')
      }

      const payload = {
        start: {
          lat: parseFloat(formData.start.lat),
          lng: parseFloat(formData.start.lng),
          address: formData.start.address,
        },
        pickup: {
          lat: parseFloat(formData.pickup.lat),
          lng: parseFloat(formData.pickup.lng),
        },
        dropoff: {
          lat: parseFloat(formData.dropoff.lat),
          lng: parseFloat(formData.dropoff.lng),
        },
        current_cycle_used_hours: parseFloat(formData.current_cycle_used_hours) || 0,
        start_datetime: formData.start_datetime
          ? new Date(formData.start_datetime).toISOString()
          : undefined,
      }

      const result = await planTrip(payload)
      setResponse(result)
      setActiveTab('map')
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 md:p-2.5 rounded-xl shadow-lg">
                  <span className="text-2xl md:text-3xl" aria-hidden="true">🚚</span>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Trip Planner
                </h1>
                <p className="text-xs md:text-sm text-gray-600 font-semibold hidden sm:block">FMCSA HOS Compliant Routing Engine</p>
              </div>
            </div>
            <div className="text-right w-full md:w-auto flex justify-center md:justify-end">
              <div className="text-sm font-bold bg-gray-50 md:bg-transparent py-2 px-4 rounded-full md:p-0">
                {response ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                    Trip Planned
                  </span>
                ) : (
                  <span className="text-gray-600">Ready to Plan</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column - Fixed only on Large Screens */}
          <div className="lg:col-span-1 h-fit lg:sticky lg:top-24">
            <TripForm onSubmit={handleSubmit} loading={loading} />
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Error</h3>
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {!response ? (
              <div className="bg-white rounded-3xl shadow-xl p-16 border-2 border-dashed border-gray-300 text-center min-h-96 flex flex-col items-center justify-center">
                <div className="text-7xl mb-6 opacity-80">🗺️</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3">No Trip Planned Yet</h3>
                <p className="text-gray-600 text-lg leading-relaxed max-w-md">
                  Fill in the form on the left with your trip details and click "Plan Trip" to see your route,
                  stops, and daily HOS-compliant logs.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-lg border-2 border-gray-100 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-xl font-bold transition-all whitespace-nowrap ${
                      activeTab === 'map'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                      🗺️ Map & Route
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-xl font-bold transition-all whitespace-nowrap ${
                      activeTab === 'logs'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                      📄 Daily Logs
                  </button>
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-shrink-0 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-xl font-bold transition-all whitespace-nowrap ${
                      activeTab === 'summary'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                      📊 Summary
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'map' && (
                  <RouteMap 
                    route={response.route} 
                    stops={response.stops} 
                    locations={{
                      start: requestData?.start,
                      pickup: requestData?.pickup,
                      dropoff: requestData?.dropoff
                    }}
                  />
                )}
                {activeTab === 'logs' && (
                  <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 overflow-y-auto max-h-screen">
                    <DailyLogRenderer dailyLogs={response.daily_logs} />
                  </div>
                )}
                {activeTab === 'summary' && <TripSummary trip={response} />}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-gray-200 bg-white/80 backdrop-blur-md mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
            <p className="text-gray-700 font-semibold mb-2">🚚 Trip Planner v1.0</p>
          <p className="text-sm text-gray-600">
            Powered by OSRM (Open Route Service) • FMCSA HOS Rules Enforced
          </p>
          <p className="text-xs text-gray-500 mt-3">© 2026 Trip Planner Assessment</p>
        </div>
      </footer>
    </div>
  )
}
