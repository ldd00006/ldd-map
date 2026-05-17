import fs from "fs";
import path from "path";
import Link from "next/link";
import DynamicMap from "@/components/dynamic-map";

function loadJson(filename: string) {
  const filePath = path.join(process.cwd(), "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export default function Home() {
  const attractions = loadJson("zhejiang-attractions.json");
  const chinaGeo = loadJson("china-provinces.geo.json");
  const zhejiangGeo = loadJson("zhejiang-counties.geo.json");
  const themes = loadJson("province-themes.json");

  // Load existing records
  let initialRecords = [];
  const recordsPath = path.join(process.cwd(), "records", "records.json");
  if (fs.existsSync(recordsPath)) {
    try {
      initialRecords = JSON.parse(fs.readFileSync(recordsPath, "utf-8"));
    } catch {}
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-5 bg-white/90 backdrop-blur border-b border-[#e8dcc8] shrink-0 z-[2000]">
        <Link href="/" className="text-sm font-bold text-[#3d3226] tracking-wide">
          🗺️ 中国地图 · 浙江景点
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/records"
            className="text-xs text-[#8b6b4a] hover:text-[#c44b3c] transition-colors"
          >
            📖 我的回忆
          </Link>
        </nav>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <DynamicMap
          attractions={attractions}
          chinaGeo={chinaGeo}
          zhejiangGeo={zhejiangGeo}
          themes={themes}
          initialRecords={initialRecords}
        />
      </div>
    </div>
  );
}
