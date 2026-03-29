import { useState, useEffect } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { format } from 'date-fns'
import { Navigation, CheckCircle } from 'lucide-react'
import type { SOSAlert } from '../../types'
import { getUserName } from '../../lib/api'

const createSOSIcon = () => L.divIcon({
  className: '',
  html: `
    <div class="sos-marker-wrapper">
      <div class="sos-ring"></div>
      <div class="sos-ring sos-ring-2"></div>
      <div class="sos-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

const EMERGENCY_COLORS: Record<string, string> = {
  medical: '#f59e0b',
  fire: '#f97316',
  crime: '#ef4444',
  accident: '#8b5cf6',
  other: '#6b7280',
}

interface Props {
  alert: SOSAlert
  isNew?: boolean
  onNavigate?: (alert: SOSAlert) => void
  onResolve?: (alert: SOSAlert) => void
}

export function SOSMarker({ alert, isNew, onNavigate, onResolve }: Props) {
  const lat = alert.lat || (alert as any).latitude || 0
  const lng = alert.lng || (alert as any).longitude || 0
  const initialName = alert.user_name || (alert as any).name || 'Unknown User'
  const [displayName, setDisplayName] = useState(initialName)
  const eType = alert.emergency_type || (alert as any).type || 'other'

  useEffect(() => {
    async function fetchRealName() {
      const email = alert.user_email || (alert as any).email
      if (displayName === 'Unknown User' && email) {
        const realName = await getUserName(email)
        if (realName) {
          setDisplayName(realName)
        }
      }
    }
    fetchRealName()
  }, [initialName, alert])

  if (!lat || !lng) return null

  return (
    <Marker position={[lat, lng]} icon={createSOSIcon()}>
      <Popup>
        <div style={{ minWidth: '220px', fontFamily: 'DM Sans, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{
              background: EMERGENCY_COLORS[alert.emergency_type] || '#6b7280',
              color: 'white',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {alert.emergency_type || (alert as any).type || 'Emergency'}
            </span>
            <span style={{
              background: alert.status === 'active' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              color: alert.status === 'active' ? '#ef4444' : '#22c55e',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              {alert.status}
            </span>
          </div>

          <div style={{ fontWeight: '600', fontSize: '14px', color: 'white', marginBottom: '4px' }}>
            {displayName}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
            {format(new Date(alert.created_at), 'dd MMM yyyy, HH:mm:ss')}
          </div>

          {alert.mesh_path?.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Mesh Relay Path
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {alert.mesh_path.map((node, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', background: '#1f1f1f', border: '1px solid #2a2a2a', padding: '2px 6px', borderRadius: '4px', color: '#60a5fa', fontFamily: 'JetBrains Mono' }}>
                      {node}
                    </span>
                    {i < alert.mesh_path.length - 1 && <span style={{ color: '#4b5563', fontSize: '10px' }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onNavigate && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #1e1e1e', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(alert); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
              >
                <Navigation size={14} /> Zoom to Location
              </button>

              {onResolve && (
                <button
                  onClick={(e) => { e.stopPropagation(); onResolve(alert); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)' }}
                >
                  <CheckCircle size={14} /> Mark as Resolved
                </button>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

export function MapController({ center, zoom, focus }: { center: [number, number]; zoom: number; focus?: {center: [number, number], zoom: number} | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (focus) {
      map.flyTo(focus.center, focus.zoom, { duration: 1.5 })
    } else {
      map.setView(center, zoom)
    }
  }, [center, zoom, focus, map])
  
  return null
}
