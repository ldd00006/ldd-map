import Link from "next/link";
import { getAllRecords } from "@/lib/records";

export default function RecordsPage() {
  const records = getAllRecords();

  return (
    <div className="min-h-full bg-[#faf7f0]">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-5 bg-white/90 backdrop-blur border-b border-[#e8dcc8]">
        <Link href="/" className="text-sm font-bold text-[#3d3226] tracking-wide">
          🗺️ 中国地图 · 浙江景点
        </Link>
        <nav className="flex gap-4">
          <Link href="/" className="text-xs text-[#8b6b4a] hover:text-[#c44b3c] transition-colors">
            🗺️ 回到地图
          </Link>
        </nav>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-[#3d3226] mb-2">📖 我的回忆</h1>
        <p className="text-sm text-[#8b6b4a] mb-8">在地图上右键添加的记录会出现在这里。</p>

        {records.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-[#c4b8a8]">还没有记录，去地图上右键添加吧</p>
            <Link href="/" className="inline-block mt-4 text-sm text-[#c44b3c] hover:underline">
              打开地图 →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-[#e8dcc8] shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-[#c44b3c] font-medium">{record.locationName}</p>
                    <p className="text-xs text-[#c4b8a8] mt-0.5">
                      {new Date(record.createdAt).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-[#c4b8a8]">
                    {record.lat.toFixed(4)}, {record.lng.toFixed(4)}
                  </span>
                </div>
                <p className="text-sm text-[#5a4a3a] leading-relaxed mb-3">{record.text}</p>
                {record.imageUrl && (
                  <img
                    src={record.imageUrl}
                    alt="记录图片"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
