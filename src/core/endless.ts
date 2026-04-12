const STORAGE_KEY = 'databloxx.endlessRecord.v1'

export interface EndlessRecord {
  blockCount: number
  height: number
  score: number
  achievedAt: string
}

export function getEndlessRecord(): EndlessRecord | null {
  return readRecord()
}

export function saveEndlessRecord(record: EndlessRecord) {
  const existing = readRecord()
  if (!existing || isBetterRecord(record, existing)) {
    writeRecord(record)
  }
}

function isBetterRecord(newRecord: EndlessRecord, existing: EndlessRecord): boolean {
  if (newRecord.blockCount > existing.blockCount) {
    return true
  }
  if (newRecord.blockCount < existing.blockCount) {
    return false
  }
  // Same block count, check score
  if (newRecord.score > existing.score) {
    return true
  }
  if (newRecord.score < existing.score) {
    return false
  }
  // Same score, check height
  return newRecord.height > existing.height
}

function readRecord(): EndlessRecord | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as EndlessRecord
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeRecord(record: EndlessRecord) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}
