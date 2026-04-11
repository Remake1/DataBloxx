import type { LevelCompletion } from './levels'

const STORAGE_KEY = 'databloxx.levelProgress.v1'

type ProgressMap = Record<string, LevelCompletion>

export function getLevelCompletion(levelId: number) {
  return readProgress()[String(levelId)]
}

export function getAllLevelCompletions() {
  return readProgress()
}

export function saveLevelCompletion(completion: LevelCompletion) {
  const progress = readProgress()
  progress[String(completion.levelId)] = completion
  writeProgress(progress)
}

function readProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as ProgressMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeProgress(progress: ProgressMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}
