"use client";

import dynamic from "next/dynamic";

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
  chinaGeo: any;
  zhejiangGeo: any;
  themes: any;
  initialRecords: RecordEntry[];
}

const MapContainer = dynamic(() => import("@/components/map-container"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#faf7f0]">
      <div className="text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <p className="text-[#8b6b4a]">地图加载中...</p>
      </div>
    </div>
  ),
});

export default function DynamicMap(props: Props) {
  return <MapContainer {...props} />;
}
