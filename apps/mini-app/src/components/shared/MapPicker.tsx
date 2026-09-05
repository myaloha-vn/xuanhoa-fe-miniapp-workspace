import { useEffect, useRef, useState } from "react";
import { MapPin, X, Navigation, Maximize2, Minimize2 } from "lucide-react";

interface MapPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lat: number, lon: number, address: string) => void;
  onChange?: (lat: number, lon: number, address: string) => void;
  initialLat?: number;
  initialLon?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

// Tọa độ mặc định: Phường Xuân Hoà, thị xã Phúc Yên, Vĩnh Phúc
const DEFAULT_LAT = 21.3297;
const DEFAULT_LON = 105.6639;

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=vi`,
      { headers: { Accept: "application/json" } }
    );
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
}

export function MapPicker({ open, onClose, onSelect, onChange, initialLat, initialLon, expanded, onToggleExpand }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [lat, setLat] = useState(initialLat ?? DEFAULT_LAT);
  const [lon, setLon] = useState(initialLon ?? DEFAULT_LON);
  const [address, setAddress] = useState("Đang tải...");
  const [loading, setLoading] = useState(false);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Load Leaflet CSS dynamically
  useEffect(() => {
    if (!open) return;
    const existingLink = document.querySelector('link[href*="leaflet"]');
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, [open]);

  // Initialize map
  useEffect(() => {
    if (!open || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix marker icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startLat = initialLat ?? DEFAULT_LAT;
      const startLon = initialLon ?? DEFAULT_LON;

      const map = L.map(mapRef.current!, {
        center: [startLat, startLon],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([startLat, startLon], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLon(pos.lng);
        setLoading(true);
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setAddress(addr);
        onChangeRef.current?.(pos.lat, pos.lng, addr);
        setLoading(false);
      });

      map.on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLon } = e.latlng;
        marker.setLatLng([clickLat, clickLon]);
        setLat(clickLat);
        setLon(clickLon);
        setLoading(true);
        const addr = await reverseGeocode(clickLat, clickLon);
        setAddress(addr);
        onChangeRef.current?.(clickLat, clickLon, addr);
        setLoading(false);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setLoading(true);
      const addr = await reverseGeocode(startLat, startLon);
      setAddress(addr);
      onChangeRef.current?.(startLat, startLon, addr);
      setLoading(false);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, initialLat, initialLon]);

  // Invalidate map size when expanded changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }
  }, [expanded]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Thiết bị không hỗ trợ định vị GPS");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLon(longitude);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        const addr = await reverseGeocode(latitude, longitude);
        setAddress(addr);
        onChangeRef.current?.(latitude, longitude, addr);
        setLoading(false);
      },
      () => {
        alert("Không lấy được vị trí hiện tại");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onSelect(lat, lon, address);
    onClose();
  };

  if (!open) return null;

  // Expanded (fullscreen) mode
  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Header */}
        <div className="shrink-0 bg-[#1565C0] px-4 py-3 flex items-center justify-between">
          <button onClick={onClose} className="p-1 active:opacity-60">
            <X size={22} className="text-white" />
          </button>
          <p className="text-white font-bold text-[15px]">Chọn vị trí trên bản đồ</p>
          <button onClick={onToggleExpand} className="p-1 active:opacity-60">
            <Minimize2 size={20} className="text-white" />
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} className="flex-1" />

        {/* Bottom panel */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-[#1565C0] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {loading ? (
                <p className="text-[13px] text-gray-400">Đang tải địa chỉ...</p>
              ) : (
                <>
                  <p className="text-[13px] text-gray-800 font-medium leading-snug">{address}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {lat.toFixed(6)}, {lon.toFixed(6)}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-[#1565C0]/30 bg-blue-50 text-[#1565C0] text-[13px] font-bold active:bg-blue-100 disabled:opacity-60"
            >
              <Navigation size={14} />
              Vị trí của tôi
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#1565C0] text-white text-[13px] font-bold active:opacity-80 disabled:opacity-60"
            >
              Xác nhận
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            Kéo thả marker hoặc chạm trên bản đồ để chọn vị trí
          </p>
        </div>
      </div>
    );
  }

  // Inline (small) mode
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Map container */}
      <div ref={mapRef} className="h-48 w-full" />

      {/* Compact footer */}
      <div className="bg-gray-50 px-3 py-2.5 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-[#1565C0] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-[11px] text-gray-400">Đang tải...</p>
            ) : (
              <p className="text-[11px] text-gray-700 leading-snug line-clamp-2">{address}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1565C0]/30 bg-white text-[#1565C0] text-[11px] font-semibold active:bg-blue-50 disabled:opacity-60"
          >
            <Navigation size={12} />
            GPS
          </button>
          <button
            onClick={onToggleExpand}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 text-[11px] font-semibold active:bg-gray-50"
          >
            <Maximize2 size={12} />
            Phóng to
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-1.5 rounded-lg bg-[#1565C0] text-white text-[11px] font-bold active:opacity-80 disabled:opacity-60"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
