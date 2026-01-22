import React from 'react'
import { Truck, MapPin, Calendar, Search } from 'lucide-react'

export default function TripForm({ onSubmit, loading }) {
  const [formData, setFormData] = React.useState({
    start: { lat: '40.7128', lng: '-74.0060', address: 'New York, NY' },
    pickup: { lat: '40.7489', lng: '-73.9680', address: 'Queens, NY' },
    dropoff: { lat: '34.0522', lng: '-118.2437', address: 'Los Angeles, CA' },
    current_cycle_used_hours: 20,
    start_datetime: new Date().toISOString().split('T')[0],
  })

  const [searching, setSearching] = React.useState({
    start: false,
    pickup: false,
    dropoff: false
  })

  // Ref to store debounce timeouts
  const searchTimeouts = React.useRef({})

  const handleChange = (e, path) => {
    const { value } = e.target
    setFormData(prev => {
      const keys = path.split('.')
      const newData = JSON.parse(JSON.stringify(prev))
      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value

      // Clear coordinates when address changes to ensure re-geocoding
      if (keys[keys.length - 1] === 'address') {
        current.lat = ''
        current.lng = ''
        
        // Auto-search logic with debounce
        const type = keys[0]
        if (searchTimeouts.current[type]) {
          clearTimeout(searchTimeouts.current[type])
        }
        
        searchTimeouts.current[type] = setTimeout(() => {
          handleSearch(type, value)
        }, 1500)
      }

      return newData
    })
  }

  // Extract geocoding logic to a reuseable helper
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'TripPlannerDemo/1.0' } }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        return { lat: data[0].lat, lng: data[0].lon }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    return null
  }

  const handleSearch = async (type, addressOverride = null) => {
    // strict check: if override is provided, use it. otherwise use state.
    const address = addressOverride !== null ? addressOverride : formData[type].address
    if (!address) return

    setSearching(prev => ({ ...prev, [type]: true }))
    
    const result = await geocodeAddress(address)
    
    if (result) {
      setFormData(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          lat: result.lat,
          lng: result.lng
        }
      }))
    }
    
    setSearching(prev => ({ ...prev, [type]: false }))
  }

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch(type)
    }
  }

  const renderLocationInput = (type, label, iconColorClass, borderColorClass, ringColorClass) => (
    <div className={`bg-white rounded-2xl p-6 border-2 border-gray-200 ${borderColorClass} shadow-sm transition-all`}>
      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
        {label}
      </label>
      
      <div className="relative mb-3">
        <input
          type="text"
          value={formData[type].address || ''}
          onChange={(e) => handleChange(e, `${type}.address`)}
          onKeyDown={(e) => handleKeyDown(e, type)}
          onBlur={() => handleSearch(type)}
          placeholder={`Enter address for ${type}`}
          className={`w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-base font-medium`}
        />
        <button
          type="button"
          onClick={() => handleSearch(type)}
          disabled={searching[type]}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          {searching[type] ? (
            <span className="animate-spin block">⏳</span>
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          step="0.0001"
          value={formData[type].lat}
          onChange={(e) => handleChange(e, `${type}.lat`)}
          placeholder="Latitude"
          className={`px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium ${ringColorClass} outline-none transition`}
        />
        <input
          type="number"
          step="0.0001"
          value={formData[type].lng}
          onChange={(e) => handleChange(e, `${type}.lng`)}
          placeholder="Longitude"
          className={`px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium ${ringColorClass} outline-none transition`}
        />
      </div>
    </div>
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Create a deep copy of formData to modify if needed
    let currentData = JSON.parse(JSON.stringify(formData))
    let hasUpdates = false

    // Check all location fields for missing coordinates
    const locations = ['start', 'pickup', 'dropoff']
    
    // Set all searching states to true temporarily
    setSearching({ start: true, pickup: true, dropoff: true })

    try {
      for (const type of locations) {
        const loc = currentData[type]
        // If we have an address but missing/invalid coordinates, try to geocode
        if (loc.address && (!loc.lat || !loc.lng || loc.lat === '' || loc.lng === '')) {
          const coords = await geocodeAddress(loc.address)
          if (coords) {
            currentData[type].lat = coords.lat
            currentData[type].lng = coords.lng
            hasUpdates = true
          }
        }
      }

      if (hasUpdates) {
        setFormData(currentData)
      }

      // Convert string values to numbers for lat/lng
      const payload = {
        start: {
          lat: parseFloat(currentData.start.lat),
          lng: parseFloat(currentData.start.lng),
          address: currentData.start.address,
        },
        pickup: {
          lat: parseFloat(currentData.pickup.lat),
          lng: parseFloat(currentData.pickup.lng),
          address: currentData.pickup.address,
        },
        dropoff: {
          lat: parseFloat(currentData.dropoff.lat),
          lng: parseFloat(currentData.dropoff.lng),
          address: currentData.dropoff.address,
        },
        current_cycle_used_hours: parseFloat(currentData.current_cycle_used_hours),
        start_datetime: currentData.start_datetime + 'T08:00:00',
      }
      onSubmit(payload)
      
    } catch (err) {
      console.error("Error during form submission processing:", err)
    } finally {
      // Reset searching state
      setSearching({ start: false, pickup: false, dropoff: false })
    }
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-2xl border border-blue-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-full shadow-lg">
          <Truck className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-gray-900">Plan Your Trip</h2>
          <p className="text-sm text-gray-600 mt-1">FMCSA HOS Compliant Route</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Location Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">Locations</h3>
          </div>

          {renderLocationInput('start', '� Start Location', 'text-green-600', 'hover:border-green-400', 'focus:ring-green-200 focus:border-green-500')}
          {renderLocationInput('pickup', '📦 Pickup Location', 'text-blue-600', 'hover:border-blue-400', 'focus:ring-blue-200 focus:border-blue-500')}
          {renderLocationInput('dropoff', '🎯 Dropoff Location', 'text-red-600', 'hover:border-red-400', 'focus:ring-red-200 focus:border-red-500')}
        </div>

        {/* Trip Settings Section */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Cycle Hours */}
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 hover:border-orange-400 shadow-sm transition-all group">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center justify-between">
                <span>⏱️ Cycle Used</span>
                <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-[10px]">70h Limit</span>
              </label>
              
              <div className="relative mb-3">
                <input
                  type="number"
                  min="0"
                  max="70"
                  step="0.1"
                  value={formData.current_cycle_used_hours}
                  onChange={(e) => handleChange(e, 'current_cycle_used_hours')}
                  className="w-full pl-4 pr-20 py-3 rounded-xl border border-gray-300 text-lg font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition text-gray-800"
                  placeholder="0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none select-none text-sm">
                  / 70 hrs
                </div>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-300"
                  style={{ width: `${Math.min((formData.current_cycle_used_hours / 70) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 hover:border-purple-400 shadow-sm transition-all">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" /> Start Date
              </label>
              <input
                type="date"
                value={formData.start_datetime}
                onChange={(e) => setFormData(prev => ({ ...prev, start_datetime: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition text-base font-bold text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg transform hover:scale-105"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block">⏳</span>
              <span>Planning Trip...</span>
            </>
          ) : (
            <>
              <Truck className="w-6 h-6" />
              <span>Plan Trip</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-600 text-center mt-4">
          💡 Tip: Enter any address - we'll automatically find the coordinates when you plan the trip.
        </p>
      </form>
    </div>
  )
}
