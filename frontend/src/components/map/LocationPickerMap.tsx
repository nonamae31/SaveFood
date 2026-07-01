import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerMapProps {
  onLocationChange: (lat: number, lng: number) => void;
  defaultPosition?: { lat: number; lng: number };
  searchTriggerAddress?: string;
}

// Custom hook to handle map clicks
function LocationMarker({ position, setPosition, onLocationChange }: any) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Effect to fly to position if it changes externally (e.g. from search)
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker 
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition(pos);
          onLocationChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

function MapResizer() {
  const map = useMapEvents({});
  useEffect(() => {
    // Force map to recalculate its size after the modal animation finishes
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);
  return null;
}

export function LocationPickerMap({ onLocationChange, defaultPosition, searchTriggerAddress }: LocationPickerMapProps) {
  // Default to Ho Chi Minh City if no position provided
  const center = defaultPosition || { lat: 10.762622, lng: 106.660172 };
  
  const [position, setPosition] = useState<L.LatLng | null>(
    defaultPosition ? new L.LatLng(defaultPosition.lat, defaultPosition.lng) : null
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Sync external position changes (e.g. from Google Maps link extraction)
  useEffect(() => {
    if (defaultPosition) {
      const newPos = new L.LatLng(defaultPosition.lat, defaultPosition.lng);
      if (!position || position.lat !== newPos.lat || position.lng !== newPos.lng) {
        setPosition(newPos);
      }
    }
  }, [defaultPosition?.lat, defaultPosition?.lng]);

  useEffect(() => {
    if (searchTriggerAddress && searchTriggerAddress !== 'Vị trí hiện tại' && searchTriggerAddress !== 'Vị trí đã chọn' && searchTriggerAddress !== 'Vị trí') {
      setSearchQuery(searchTriggerAddress);
    }
  }, [searchTriggerAddress]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Use Esri ArcGIS Geocoding API (Better coverage for Vietnam, no API key required for basic search)
      const response = await fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(query)}&maxLocations=1`
      );
      const data = await response.json();
      
      if (data && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const lat = candidate.location.y;
        const lon = candidate.location.x;
        const newPos = new L.LatLng(lat, lon);
        setPosition(newPos);
        onLocationChange(lat, lon);
      } else {
        toast.error('Không tìm thấy tọa độ cho địa chỉ này, vui lòng nhập chi tiết hơn hoặc tự chấm ghim!');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Lỗi khi tìm kiếm địa chỉ!');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      {/* Search Bar & GPS Button */}
      <div className="flex gap-2 relative z-10">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition-all">
            <div className="pl-3 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm địa chỉ để chấm ghim..."
              className="flex-1 py-3 px-3 outline-none text-sm"
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="px-4 py-3 bg-green-50 text-green-700 font-semibold text-sm hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isSearching ? 'Đang tìm...' : 'Tìm vị trí'}
            </button>
          </div>
        </form>
        <button
          type="button"
          onClick={() => {
            if ('geolocation' in navigator) {
              const toastId = toast.loading('Đang lấy vị trí hiện tại...');
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  toast.dismiss(toastId);
                  const lat = pos.coords.latitude;
                  const lng = pos.coords.longitude;
                  const newPos = new L.LatLng(lat, lng);
                  setPosition(newPos);
                  onLocationChange(lat, lng);
                  toast.success('Đã lấy được vị trí hiện tại!');
                },
                (err) => {
                  toast.dismiss(toastId);
                  console.error(err);
                  if (err.code === 3) { // TIMEOUT
                    toast.error('Quá thời gian lấy vị trí. Thử lại ở khu vực thoáng hơn.');
                  } else {
                    toast.error('Không thể lấy vị trí. Kiểm tra cài đặt Vị trí trên thiết bị!');
                  }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            }
          }}
          className="flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 rounded-xl px-4 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors shadow-sm"
          title="Dùng vị trí hiện tại (GPS)"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0">
        <MapContainer 
          center={center} 
          zoom={13} 
          style={{ width: '100%', height: '100%' }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Bản đồ đường phố">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Bản đồ vệ tinh">
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <MapResizer />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onLocationChange={onLocationChange} 
          />
        </MapContainer>

        {/* Instructions overlay if no pin yet */}
        {!position && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold text-gray-700 flex items-center gap-2 pointer-events-auto cursor-pointer animate-pulse">
              <MapPin className="w-4 h-4 text-green-600" />
              Click vào bản đồ để chấm tọa độ
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 italic flex justify-between">
        <span>* Bạn có thể kéo thả ghim đỏ để điều chỉnh vị trí chính xác.</span>
        {position && (
          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
        )}
      </div>
    </div>
  );
}
