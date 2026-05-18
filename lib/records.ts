import { put, list, del } from "@vercel/blob";

export interface RecordEntry {
  id: string;
  lat: number;
  lng: number;
  text: string;
  imageUrl: string;
  locationName: string;
  createdAt: string;
}

const RECORDS_META_KEY = "map/records.json";

async function readRecords(): Promise<RecordEntry[]> {
  try {
    const { blobs } = await list({ prefix: RECORDS_META_KEY });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeRecords(records: RecordEntry[]): Promise<void> {
  const json = JSON.stringify(records);
  await put(RECORDS_META_KEY, new Blob([json], { type: "application/json" }), {
    access: "public",
    addRandomSuffix: false,
  });
}

export async function getAllRecords(): Promise<RecordEntry[]> {
  const records = await readRecords();
  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addRecord(
  record: Omit<RecordEntry, "id" | "createdAt">
): Promise<RecordEntry> {
  const records = await readRecords();
  const newRecord: RecordEntry = {
    ...record,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
  };
  records.push(newRecord);
  await writeRecords(records);
  return newRecord;
}

export async function deleteRecord(id: string): Promise<boolean> {
  const records = await readRecords();
  const before = records.length;
  const filtered = records.filter((r) => r.id !== id);
  if (filtered.length === before) return false;
  await writeRecords(filtered);
  return true;
}
