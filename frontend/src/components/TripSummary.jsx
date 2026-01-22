import React from 'react'
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default function TripSummary({ trip }) {
  if (!trip) return null

  const { route, segments, daily_logs, warnings, weather } = trip

  // Calculate totals
  const totalDriving = segments?.reduce((sum, s) => (s.status === 'D' ? sum + (new Date(s.end_datetime) - new Date(s.start_datetime)) / (1000 * 60 * 60) : sum), 0) || 0
  const totalON = segments?.reduce((sum, s) => (s.status === 'ON' ? sum + (new Date(s.end_datetime) - new Date(s.start_datetime)) / (1000 * 60 * 60) : sum), 0) || 0
  const tripDays = daily_logs?.length || 0

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" /> Trip Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div>
            <div className="text-indigo-200 text-xs md:text-sm font-semibold mb-1">Total Distance</div>
            <div className="text-2xl md:text-4xl font-bold">{Math.round(route?.total_distance_miles || 0)} <span className="text-sm md:text-lg">miles</span></div>
          </div>
          <div>
            <div className="text-indigo-200 text-xs md:text-sm font-semibold mb-1">Total Duration</div>
            <div className="text-2xl md:text-4xl font-bold">{tripDays} <span className="text-sm md:text-lg">days</span></div>
          </div>
          <div>
            <div className="text-indigo-200 text-xs md:text-sm font-semibold mb-1">Driving Hours</div>
            <div className="text-2xl md:text-4xl font-bold">{totalDriving.toFixed(1)}h</div>
          </div>
          <div>
            <div className="text-indigo-200 text-xs md:text-sm font-semibold mb-1">On-Duty Hours</div>
            <div className="text-2xl md:text-4xl font-bold">{totalON.toFixed(1)}h</div>
          </div>
        </div>

        {weather && (weather.start || weather.dropoff) && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {weather.start && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="font-semibold mb-1">Start Location Weather</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{weather.start.temperature_c ?? '–'}
                    <span className="text-base align-super ml-0.5">°C</span>
                  </span>
                  <span className="text-indigo-100">
                    Wind {weather.start.windspeed_kmh ?? '–'} km/h
                  </span>
                </div>
              </div>
            )}

            {weather.dropoff && (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="font-semibold mb-1">Dropoff Weather</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{weather.dropoff.temperature_c ?? '–'}
                    <span className="text-base align-super ml-0.5">°C</span>
                  </span>
                  <span className="text-indigo-100">
                    Wind {weather.dropoff.windspeed_kmh ?? '–'} km/h
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warnings Section */}
      {warnings && warnings.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-l-4 border-orange-600 rounded-2xl shadow-md p-8">
          <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" /> Important Notes
          </h3>
          <ul className="space-y-3">
            {warnings.map((warning, i) => (
              <li key={i} className="flex gap-3 text-orange-900">
                <span className="text-orange-600 font-bold text-lg">⚠</span>
                <span className="font-semibold">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rules Compliance */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" /> HOS Compliance
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
            <div className="text-sm text-gray-600 font-semibold mb-2">11-Hour Limit</div>
            <div className="text-3xl font-bold text-green-600">✓</div>
            <div className="text-xs text-green-700 mt-2">Enforced</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
            <div className="text-sm text-gray-600 font-semibold mb-2">14-Hour Window</div>
            <div className="text-3xl font-bold text-green-600">✓</div>
            <div className="text-xs text-green-700 mt-2">Enforced</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
            <div className="text-sm text-gray-600 font-semibold mb-2">30-Min Break</div>
            <div className="text-3xl font-bold text-green-600">✓</div>
            <div className="text-xs text-green-700 mt-2">Enforced</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
            <div className="text-sm text-gray-600 font-semibold mb-2">70-Hour Cycle</div>
            <div className="text-3xl font-bold text-green-600">✓</div>
            <div className="text-xs text-green-700 mt-2">Enforced</div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      {daily_logs && daily_logs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" /> Daily Breakdown
          </h3>

          <div className="space-y-4">
            {daily_logs.map((log, i) => (
              <div key={i} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800">Day {i + 1} — {log.date}</span>
                  <span className="text-sm text-gray-600">{log.miles} miles</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">OFF</div>
                    <div className="text-lg font-bold text-gray-800">{log.totals.OFF_hours.toFixed(1)}h</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">SB</div>
                    <div className="text-lg font-bold text-blue-600">{log.totals.SB_hours.toFixed(1)}h</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">D</div>
                    <div className="text-lg font-bold text-red-600">{log.totals.D_hours.toFixed(1)}h</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">ON</div>
                    <div className="text-lg font-bold text-yellow-600">{log.totals.ON_hours.toFixed(1)}h</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
