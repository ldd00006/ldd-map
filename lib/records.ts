import fs from "fs";
import path from "path";

export interface RecordEntry {
  id: string;
  lat: number;
  lng: number;
  text: string;
  imageUrl: string;
  locationName: string;
  createdAt: string;
}

const recordsDir = path.join(process.cwd(), "records");
const recordsFile = path.join(recordsDir, "records.json");

function ensureFile(): void {
  if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
  }
  if (!fs.existsSync(recordsFile)) {
    fs.writeFileSync(recordsFile, "[]", "utf-8");
  }
}

export function getAllRecords(): RecordEntry[] {
  ensureFile();
  const raw = fs.readFileSync(recordsFile, "utf-8");
  try {
    const records: RecordEntry[] = JSON.parse(raw);
    return records.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function addRecord(record: Omit<RecordEntry, "id" | "createdAt">): RecordEntry {
  ensureFile();
  const records = getAllRecords();
  const newRecord: RecordEntry = {
    ...record,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
  };
  records.push(newRecord);
  fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2), "utf-8");
  return newRecord;
}

export function deleteRecord(id: string): boolean {
  ensureFile();
  let records = getAllRecords();
  const before = records.length;
  records = records.filter((r) => r.id !== id);
  if (records.length === before) return false;
  fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2), "utf-8");
  return true;
}
