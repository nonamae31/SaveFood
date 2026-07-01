import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CustomerListingDTO } from '@/types/listing.types'
import { ListingCard } from './ListingCard'

// Fix default icon issue with Leaflet and Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface ListingMapViewProps {
  listings: CustomerListingDTO[]
}

// Custom hook to fit bounds when markers change
function FitBounds({ markers }: { markers: [number, number][] }) {
  const map = useMap()
  
  React.useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [map, markers])

  return null
}

// We memoize it to avoid unmounting the map during re-renders if not needed
export const ListingMapView = React.memo(function ListingMapView({ listings }: ListingMapViewProps) {
  // Group listings by store coordinates so we don't have multiple markers at the exact same spot
  const storeGroups = useMemo(() => {
    const groups: Record<string, { lat: number, lng: number, listings: CustomerListingDTO[] }> = {}
    
    listings.forEach(listing => {
      const lat = listing.storeLatitude
      const lng = listing.storeLongitude
      
      // Skip if no coordinates
      if (lat === undefined || lng === undefined) return
      
      const key = `${lat},${lng}`
      if (!groups[key]) {
        groups[key] = { lat, lng, listings: [] }
      }
      groups[key].listings.push(listing)
    })
    
    return Object.values(groups)
  }, [listings])

  const markerPositions = storeGroups.map(g => [g.lat, g.lng] as [number, number])

  // Default center (e.g. HCMC or user's location if available)
  const defaultCenter: [number, number] = [10.762622, 106.660172] // HCMC center

  if (!listings || listings.length === 0) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-gray-500 font-medium">Không có kết quả nào để hiển thị trên bản đồ.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[500px] sm:min-h-[600px] rounded-[1.5rem] overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          // We use CartoDB Voyager for a cleaner, modern look
        />
        
        {markerPositions.length > 0 && <FitBounds markers={markerPositions} />}

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
        >
          {storeGroups.map((group, idx) => (
            <Marker 
              key={`${group.lat}-${group.lng}-${idx}`}
              position={[group.lat, group.lng]}
            >
              <Popup className="listing-popup" minWidth={280} maxWidth={320}>
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto p-1 custom-scrollbar">
                  <h4 className="font-bold text-[--color-ink-primary] border-b pb-2 sticky top-0 bg-white z-10">
                    {group.listings[0].storeName} 
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({group.listings.length} tin)
                    </span>
                  </h4>
                  
                  <div className="flex flex-col gap-3">
                    {group.listings.map(listing => (
                      <div key={listing.id} className="w-full">
                        <ListingCard listing={listing} />
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      
      {/* Add some global styles for the popup to override leaflet defaults */}
      <style>{`
        .listing-popup .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .listing-popup .leaflet-popup-content {
          margin: 12px;
          width: auto !important;
        }
        .listing-popup .leaflet-popup-tip {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}</style>
    </div>
  )
})
