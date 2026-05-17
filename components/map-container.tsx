"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Attraction {
  name: string;
  city: string;
  county: string;
  lat: number;
  lng: number;
  desc: string;
  tags: string[];
  image: string;
}

interface RecordEntry {
  id: string;
  lat: number;
  lng: number;
  text: string;
  imageUrl: string;
  locationName: string;
  createdAt: string;
}

interface Props {
  attractions: Attraction[];
  chinaGeo: GeoJSON.FeatureCollection;
  zhejiangGeo: GeoJSON.FeatureCollection;
  themes: Record<string, { fillColor: string; borderColor: string; highlightFill: string; highlightBorder: string; style: string; desc: string }>;
  initialRecords: RecordEntry[];
}

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createAttractionIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;background:#c44b3c;border:2px solid #fff;
      border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);
      animation:pulse 2s infinite;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createRecordIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;background:#3b82c4;border:2px solid #fff;
      border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function MapContainer({ attractions, chinaGeo, zhejiangGeo, themes, initialRecords }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const chinaLayerRef = useRef<L.GeoJSON | null>(null);
  const zjLayerRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const recordMarkersRef = useRef<L.Marker[]>([]);

  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Attraction[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [recordLat, setRecordLat] = useState(0);
  const [recordLng, setRecordLng] = useState(0);
  const [recordLocationName, setRecordLocationName] = useState("");
  const [records, setRecords] = useState<RecordEntry[]>(initialRecords);

  // Search
  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (q.trim().length === 0) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      const results = attractions.filter(
        (a) =>
          a.name.includes(q) ||
          a.city.includes(q) ||
          a.county.includes(q) ||
          a.tags.some((t) => t.includes(q))
      );
      setSearchResults(results.slice(0, 10));
      setShowSearchResults(true);
    },
    [attractions]
  );

  const flyTo = (lat: number, lng: number, zoom: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  const handleSearchSelect = (attraction: Attraction) => {
    flyTo(attraction.lat, attraction.lng, 13);
    setSelectedAttraction(attraction);
    setSidebarOpen(true);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  // Add record
  const submitRecord = async (text: string, imageFile: File | null) => {
    let imageUrl = "";
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const res = await fetch("/api/records/upload", { method: "POST", body: formData });
        const data = await res.json();
        imageUrl = data.url;
      } catch (e) {
        console.error("Upload failed", e);
      }
    }

    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: recordLat,
        lng: recordLng,
        text,
        imageUrl,
        locationName: recordLocationName,
      }),
    });
    if (res.ok) {
      const newRecord: RecordEntry = await res.json();
      setRecords((prev) => [newRecord, ...prev]);
    }
    setRecordFormOpen(false);
  };

  const deleteRecord = async (id: string) => {
    const res = await fetch(`/api/records?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [29.5, 120.0],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // China provinces layer
    const chinaLayer = L.geoJSON(chinaGeo, {
      style: (feature) => {
        const name = feature?.properties?.name || "";
        const theme = themes[name] || themes["default"];
        return {
          fillColor: theme.fillColor,
          color: theme.borderColor,
          weight: 1.5,
          fillOpacity: 0.5,
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          const name = feature.properties?.name;
          if (name === "浙江省") {
            map.fitBounds((layer as any).getBounds(), { padding: [30, 30] });
            showZhejiangDetail();
          } else if (name) {
            map.fitBounds((layer as any).getBounds(), { padding: [30, 30] });
          }
        });
        layer.on("mouseover", (e) => {
          const l = e.target;
          const name = feature?.properties?.name || "";
          const theme = themes[name] || themes["default"];
          l.setStyle({ fillColor: theme.highlightFill, color: theme.highlightBorder, weight: 2 });
        });
        layer.on("mouseout", () => {
          chinaLayer.resetStyle(layer);
        });
      },
    }).addTo(map);

    chinaLayerRef.current = chinaLayer;

    // Zhejiang counties layer (initially hidden)
    const zjLayer = L.geoJSON(zhejiangGeo, {
      style: {
        fillColor: "#d4ead4",
        color: "#5a8a5a",
        weight: 1,
        fillOpacity: 0.3,
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          const name = feature.properties?.name;
          if (name) {
            const countyAttractions = attractions.filter((a) => a.county === name || a.city === name);
            if (countyAttractions.length === 1) {
              handleSearchSelect(countyAttractions[0]);
            } else if (countyAttractions.length > 1) {
              setSearchResults(countyAttractions);
              setShowSearchResults(true);
            }
            map.fitBounds((layer as any).getBounds(), { padding: [30, 30] });
          }
        });
        layer.on("mouseover", (e) => {
          e.target.setStyle({ fillColor: "#b8d8b8", fillOpacity: 0.5, weight: 2 });
        });
        layer.on("mouseout", () => {
          zjLayer.resetStyle(layer);
        });
        layer.bindTooltip(feature.properties?.name || "", {
          permanent: false,
          direction: "center",
          className: "text-xs bg-white/80 px-2 py-0.5 rounded border-0 shadow-sm",
        });
      },
    });
    zjLayerRef.current = zjLayer;

    // Attraction markers
    const markers: L.Marker[] = [];
    attractions.forEach((attr) => {
      const marker = L.marker([attr.lat, attr.lng], { icon: createAttractionIcon() })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px">
            <h3 style="margin:0 0 4px;font-size:15px;color:#3d3226">${attr.name}</h3>
            <p style="margin:0 0 6px;font-size:12px;color:#8b6b4a">${attr.city} · ${attr.county}</p>
            <p style="margin:0;font-size:13px;color:#5a4a3a;line-height:1.5">${attr.desc.slice(0, 100)}...</p>
          </div>`
        );
      marker.on("click", () => {
        setSelectedAttraction(attr);
        setSidebarOpen(true);
      });
      markers.push(marker);
    });
    markersRef.current = markers;

    // Record markers
    const recMarkers = renderRecordMarkers(map, records, deleteRecord);
    recordMarkersRef.current = recMarkers;

    // Listen for delete-record events from popup buttons
    const handleDeleteEvent = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (id) deleteRecord(id);
    };
    document.addEventListener("delete-record", handleDeleteEvent);

    // Right click
    map.on("contextmenu", async (e) => {
      const { lat, lng } = e.latlng;
      setRecordLat(lat);
      setRecordLng(lng);
      // Reverse geocode
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=zh`
        );
        const data = await res.json();
        setRecordLocationName(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } catch {
        setRecordLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
      setRecordFormOpen(true);
    });

    mapRef.current = map;

    return () => {
      document.removeEventListener("delete-record", handleDeleteEvent);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync record markers when records change
  useEffect(() => {
    if (!mapRef.current) return;
    recordMarkersRef.current.forEach((m) => m.remove());
    recordMarkersRef.current = renderRecordMarkers(mapRef.current, records, deleteRecord);
  }, [records]);

  function renderRecordMarkers(map: L.Map, recs: RecordEntry[], onDelete: (id: string) => void) {
    return recs.map((r) => {
      const marker = L.marker([r.lat, r.lng], { icon: createRecordIcon() }).addTo(map);
      marker.bindPopup(
        `<div style="min-width:160px">
          <h3 style="margin:0 0 4px;font-size:14px;color:#3d3226">📌 我的记录</h3>
          <p style="margin:0 0 4px;font-size:12px;color:#8b6b4a">${r.locationName}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#5a4a3a;line-height:1.5">${r.text.slice(0, 80)}</p>
          ${r.imageUrl ? `<img src="${r.imageUrl}" style="width:100%;border-radius:4px;margin-bottom:4px" />` : ""}
          <button onclick="document.dispatchEvent(new CustomEvent('delete-record', {detail:'${r.id}'}))" style="font-size:11px;color:#c44b3c;border:none;background:none;cursor:pointer;padding:0">删除</button>
        </div>`
      );
      return marker;
    });
  }

  function showZhejiangDetail() {
    if (zjLayerRef.current && mapRef.current) {
      if (!mapRef.current.hasLayer(zjLayerRef.current)) {
        zjLayerRef.current.addTo(mapRef.current);
      }
    }
  }

  const toggleZhejiangLayer = () => {
    if (!mapRef.current || !zjLayerRef.current) return;
    if (mapRef.current.hasLayer(zjLayerRef.current)) {
      mapRef.current.removeLayer(zjLayerRef.current);
    } else {
      zjLayerRef.current.addTo(mapRef.current);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Map */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索景点、城市、标签..."
            className="w-full px-4 py-2.5 text-sm bg-white/95 backdrop-blur border border-[#d4c8b8] rounded-lg shadow-sm focus:outline-none focus:border-[#c44b3c] text-[#3d3226] placeholder-[#c4b8a8]"
          />
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white/95 backdrop-blur border border-[#d4c8b8] rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((a, i) => (
                <button
                  key={i}
                  onClick={() => handleSearchSelect(a)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#faf7f0] border-b border-[#f0e8d8] last:border-b-0"
                >
                  <div className="text-sm font-medium text-[#3d3226]">{a.name}</div>
                  <div className="text-xs text-[#8b6b4a]">{a.city} · {a.county}</div>
                </button>
              ))}
            </div>
          )}
          {showSearchResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full mt-1 w-full bg-white/95 backdrop-blur border border-[#d4c8b8] rounded-lg shadow-lg p-4 text-sm text-[#c4b8a8] text-center">
              未找到匹配的景点
            </div>
          )}
        </div>
        <button
          onClick={toggleZhejiangLayer}
          className="px-3 py-2 text-xs bg-white/95 border border-[#d4c8b8] rounded-lg shadow-sm hover:bg-[#faf7f0] text-[#5a4030]"
          title="切换浙江区县视图"
        >
          浙江区县
        </button>
      </div>

      {/* Theme indicator */}
      <div className="absolute bottom-6 right-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur border border-[#d4c8b8] rounded-lg shadow-sm px-3 py-1.5 text-xs text-[#8b6b4a]">
          🗺️ 点击省份查看 | 右键添加记录
        </div>
      </div>

      {/* Attraction detail sidebar */}
      {sidebarOpen && selectedAttraction && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/97 backdrop-blur border-l border-[#d4c8b8] shadow-lg z-[1000] overflow-y-auto">
          <div className="p-5">
            <button
              onClick={() => { setSidebarOpen(false); setSelectedAttraction(null); }}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[#f0e8d8] text-[#8b6b4a] hover:bg-[#e0d4c0] text-sm"
            >
              ✕
            </button>
            <img
              src={selectedAttraction.image}
              alt={selectedAttraction.name}
              className="w-full h-44 object-cover rounded-lg mb-4"
            />
            <h2 className="text-lg font-bold text-[#3d3226] mb-1">{selectedAttraction.name}</h2>
            <p className="text-xs text-[#8b6b4a] mb-2">{selectedAttraction.city} · {selectedAttraction.county}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedAttraction.tags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-[#faf0e8] text-[#c4783d] rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm text-[#5a4a3a] leading-relaxed">{selectedAttraction.desc}</p>
            <button
              onClick={() => {
                flyTo(selectedAttraction.lat, selectedAttraction.lng, 15);
              }}
              className="mt-4 text-xs text-[#c44b3c] hover:underline"
            >
              📍 飞到这里
            </button>
          </div>
        </div>
      )}

      {/* Record form modal */}
      {recordFormOpen && (
        <RecordForm
          locationName={recordLocationName}
          onSubmit={submitRecord}
          onClose={() => setRecordFormOpen(false)}
        />
      )}
    </div>
  );
}

function RecordForm({
  locationName,
  onSubmit,
  onClose,
}: {
  locationName: string;
  onSubmit: (text: string, imageFile: File | null) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg border border-[#d4c8b8] w-full max-w-md mx-4 p-5">
        <h3 className="text-base font-bold text-[#3d3226] mb-1">添加记录</h3>
        <p className="text-xs text-[#8b6b4a] mb-4">{locationName}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="写点什么..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-[#d4c8b8] rounded-lg resize-none focus:outline-none focus:border-[#c44b3c] text-[#3d3226] placeholder-[#c4b8a8] mb-3"
        />
        <div className="mb-3">
          <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-[#8b6b4a]" />
          {preview && (
            <img src={preview} alt="预览" className="mt-2 w-full h-32 object-cover rounded-lg" />
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-[#8b6b4a] bg-[#f0e8d8] rounded-lg hover:bg-[#e0d4c0]"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit(text, imageFile)}
            disabled={!text.trim()}
            className="px-4 py-1.5 text-xs text-white bg-[#c44b3c] rounded-lg hover:bg-[#a83a30] disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
