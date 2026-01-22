import React from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

export default function DailyLogRenderer({ dailyLogs = [] }) {
  if (!dailyLogs || dailyLogs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No daily logs yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {dailyLogs.map((log, dayIndex) => (
        <div key={dayIndex} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <h3 className="text-2xl font-bold mb-2">Daily Log — {log.date}</h3>
            <p className="text-blue-100">Day {dayIndex + 1} of Trip</p>
          </div>

          <div className="p-8">
            {/* 24-Hour Grid */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Duty Status Timeline (24 Hours)</h4>
              <div className="grid grid-cols-24 gap-0.5 bg-gray-300 p-0.5 rounded-lg overflow-x-auto">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const hourSegments = log.segments.filter((seg) => {
                    const start = new Date(seg.start_datetime).getUTCHours()
                    const end = new Date(seg.end_datetime).getUTCHours()
                    return hour >= start && hour < end
                  })

                  const statusColor = {
                    OFF: '#1f2937',
                    SB: '#3b82f6',
                    D: '#ef4444',
                    ON: '#f59e0b',
                  }

                  const mainStatus = hourSegments.length > 0 ? hourSegments[0].status : 'OFF'
                  const bgColor = statusColor[mainStatus] || '#e5e7eb'

                  return (
                    <div
                      key={hour}
                      className="flex flex-col items-center justify-center py-4 text-xs font-bold"
                      style={{ backgroundColor: bgColor, color: 'white', minWidth: '40px' }}
                      title={`${hour}:00 - ${mainStatus}`}
                    >
                      <span className="hidden md:inline">{hour}</span>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-800 rounded"></div>
                  <span className="text-sm font-semibold text-gray-700">OFF</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <span className="text-sm font-semibold text-gray-700">Sleeper</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded"></div>
                  <span className="text-sm font-semibold text-gray-700">Driving</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                  <span className="text-sm font-semibold text-gray-700">On Duty</span>
                </div>
              </div>
            </div>

            {/* Hours Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold">OFF Hours</div>
                <div className="text-3xl font-bold text-gray-800">{log.totals.OFF_hours.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold">Sleeper Hours</div>
                <div className="text-3xl font-bold text-blue-600">{log.totals.SB_hours.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold">Driving Hours</div>
                <div className="text-3xl font-bold text-red-600">{log.totals.D_hours.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold">On-Duty Hours</div>
                <div className="text-3xl font-bold text-yellow-600">{log.totals.ON_hours.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-semibold">Miles</div>
                <div className="text-3xl font-bold text-purple-600">{log.miles}</div>
              </div>
            </div>

            {/* Detailed Segments */}
            <div className="mb-8">
              <h5 className="text-lg font-bold text-gray-800 mb-4">Segment Breakdown</h5>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {log.segments.map((seg, i) => {
                  const start = new Date(seg.start_datetime)
                  const end = new Date(seg.end_datetime)
                  const duration = (end - start) / (1000 * 60 * 60)

                  const statusBg = {
                    OFF: 'bg-gray-100 border-l-4 border-gray-800',
                    SB: 'bg-blue-50 border-l-4 border-blue-600',
                    D: 'bg-red-50 border-l-4 border-red-600',
                    ON: 'bg-yellow-50 border-l-4 border-yellow-600',
                  }

                  return (
                    <div key={i} className={`p-3 rounded ${statusBg[seg.status]}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-bold text-gray-800">{seg.status}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            {start.toLocaleTimeString()} - {end.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-800">{duration.toFixed(2)}h</div>
                          {seg.miles > 0 && <div className="text-xs text-gray-600">{seg.miles.toFixed(0)}mi</div>}
                        </div>
                      </div>
                      {seg.note && <div className="text-xs text-gray-600 mt-1">📍 {seg.note}</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Remarks */}
            {log.remarks && log.remarks.length > 0 && (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h5 className="font-bold text-gray-800 mb-2">📍 Locations & Notes</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {log.remarks.map((remark, i) => (
                    <li key={i} className="flex gap-2">
                      <span>•</span>
                      <span>{remark}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
