import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中国地图·浙江景点",
  description: "探索浙江省各县市著名景点，记录你的旅行回忆。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
