import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Fuel, Clock, Navigation } from 'lucide-react'

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

const startIcon = createIcon('#10b981', '🚚')
const pickupIcon = createIcon('#3b82f6', '📦')
const dropoffIcon = createIcon('#ef4444', '🎯')
const fuelIcon = createIcon('#f59e0b', '⛽')
const restIcon = createIcon('#8b5cf6', '🛏️')

// Component to fit bounds when route changes
function FitBounds({ coordinates }) {
  const map = useMap()
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const latLngs = coordinates.map(([lng, lat]) => [lat, lng])
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [coordinates, map])
  
  return null
}

export default function RouteMap({ route, stops, locations }) {
  if (!route || !route.geometry || !route.geometry.coordinates) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" /> Route Overview
        </h2>
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-16 text-center">
          <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">No route data available yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "Plan Trip" to generate your route</p>
        </div>
      </div>
    )
  }

  const coordinates = route.geometry.coordinates
  // Convert [lng, lat] to [lat, lng] for Leaflet
  const routePath = coordinates.map(([lng, lat]) => [lat, lng])
  
  // Use explicit coordinates if available
  const startPos = locations?.start?.lat && locations?.start?.lng 
    ? [locations.start.lat, locations.start.lng] 
    : routePath[0]

  const dropoffPos = locations?.dropoff?.lat && locations?.dropoff?.lng
    ? [locations.dropoff.lat, locations.dropoff.lng]
    : (routePath.length > 0 ? routePath[routePath.length - 1] : null)

  const pickupPos = locations?.pickup?.lat && locations?.pickup?.lng
    ? [locations.pickup.lat, locations.pickup.lng]
    : null

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-blue-600" /> Route Overview
      </h2>

      {/* Interactive Map */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 mb-6 h-[300px] md:h-[450px]">
        <MapContainer
          center={startPos || [39.8283, -98.5795]} // Default to US Center
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds coordinates={coordinates} />
          
          {/* Route line */}
          <Polyline
            positions={routePath}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
          />
          
          {/* Start marker: Only show if valid */}
          {startPos && (
            <Marker position={startPos} icon={startIcon}>
              <Popup>
                <div className="font-semibold">🚚 Start Location</div>
                <div className="text-sm text-gray-600">{locations?.start?.address || 'Trip begins here'}</div>
              </Popup>
            </Marker>
          )}

          {/* Pickup marker: Only show if valid */}
          {pickupPos && (
            <Marker position={pickupPos} icon={pickupIcon}>
              <Popup>
                <div className="font-semibold">📦 Pickup Location</div>
                <div className="text-sm text-gray-600">{locations?.pickup?.address || 'Load cargo (1 hour)'}</div>
              </Popup>
            </Marker>
          )}

          {/* Dropoff marker: Only show if valid */}
          {dropoffPos && (
            <Marker position={dropoffPos} icon={dropoffIcon}>
              <Popup>
                <div className="font-semibold">🎯 Dropoff Location</div>
                <div className="text-sm text-gray-600">{locations?.dropoff?.address || 'Delivery destination'}</div>
              </Popup>
            </Marker>
          )}

          {/* Stop markers */}
          {stops && stops.map((stop, i) => {
            if (stop.lat && stop.lng && stop.lat !== 0 && stop.lng !== 0) {
              const icon = stop.type === 'fuel' ? fuelIcon : restIcon
              return (
                <Marker key={i} position={[stop.lat, stop.lng]} icon={icon}>
                  <Popup>
                    <div className="font-semibold">
                      {stop.type === 'fuel' ? '⛽ Fuel Stop' : '🛏️ Rest Stop'}
                    </div>
                    <div className="text-sm text-gray-600">{stop.label}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(stop.estimated_arrival).toLocaleString()}
                    </div>
                  </Popup>
                </Marker>
              )
            }
            return null
          })}
        </MapContainer>
      </div>

      {/* Route Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-blue-50 p-3 md:p-4 rounded-xl border-l-4 border-blue-600">
          <div className="text-xs md:text-sm text-gray-600 font-semibold">Total Distance</div>
          <div className="text-lg md:text-2xl font-bold text-blue-600">
            {Math.round(route.total_distance_miles).toLocaleString()} <span className="text-base text-blue-500">mi</span>
          </div>
        </div>
        <div className="bg-green-50 p-3 md:p-4 rounded-xl border-l-4 border-green-600">
          <div className="text-xs md:text-sm text-gray-600 font-semibold">Est. Drive Time</div>
          <div className="text-lg md:text-2xl font-bold text-green-600">
            {Math.round(route.total_duration_hours)}h
          </div>
        </div>
        <div className="bg-orange-50 p-3 md:p-4 rounded-xl border-l-4 border-orange-600">
          <div className="text-xs md:text-sm text-gray-600 font-semibold">Fuel Stops</div>
          <div className="text-lg md:text-2xl font-bold text-orange-600">
            {stops?.filter((s) => s.type === 'fuel').length || 0}
          </div>
        </div>
        <div className="bg-purple-50 p-3 md:p-4 rounded-xl border-l-4 border-purple-600">
          <div className="text-xs md:text-sm text-gray-600 font-semibold">Rest Stops</div>
          <div className="text-lg md:text-2xl font-bold text-purple-600">
            {stops?.filter((s) => s.type === 'rest').length || 0}
          </div>
        </div>
      </div>

      {/* Stops Legend */}
      {stops && stops.length > 0 && (
        <div className="border-t-2 border-gray-100 pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Scheduled Stops
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stops.map((stop, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className={`p-2 rounded-full ${stop.type === 'fuel' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                    {stop.type === 'fuel' ? (
                      <Fuel className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{stop.label}</div>
                    <div className="text-sm text-gray-600">
                      {stop.type === 'fuel' ? '30 min fuel stop' : 'Rest break'}
                    </div>
                  </div>
                </div>
                
                <div className="text-left sm:text-right text-sm sm:flex-1 pl-12 sm:pl-0 w-full sm:w-auto">
                  <div className="text-gray-700 font-medium">
                    {new Date(stop.estimated_arrival).toLocaleDateString()}
                  </div>
                  <div className="text-gray-500">
                    {new Date(stop.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Start</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Dropoff</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-orange-500"></span>
            <span className="text-gray-600">Fuel Stop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-purple-500"></span>
            <span className="text-gray-600">Rest Stop</span>
          </div>
        </div>
      </div>
    </div>
  )
}
