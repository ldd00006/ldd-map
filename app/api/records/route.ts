import { NextRequest, NextResponse } from "next/server";
import { getAllRecords, addRecord, deleteRecord } from "@/lib/records";

export async function GET() {
  const records = getAllRecords();
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { lat, lng, text, imageUrl, locationName } = body;
  if (!text || lat == null || lng == null) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }
  const record = addRecord({ lat, lng, text, imageUrl: imageUrl || "", locationName: locationName || "" });
  return NextResponse.json(record);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "缺少id" }, { status: 400 });
  }
  const ok = deleteRecord(id);
  if (!ok) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
