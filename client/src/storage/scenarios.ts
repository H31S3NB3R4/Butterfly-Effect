import { z } from 'zod'

import { scenarioGraphSchema, type ScenarioGraph } from '../types/graph'

const STORAGE_KEY = 'butterfly-effect:scenarios:v1'
const MAX_SAVED = 20

const savedScenarioSchema = z.object({
  id: z.string().uuid(),
  savedAt: z.string().datetime(),
  graph: scenarioGraphSchema,
})

const librarySchema = z.object({
  version: z.literal(1),
  activeId: z.string().uuid().nullable(),
  records: z.array(z.unknown()),
})

export type SavedScenario = z.infer<typeof savedScenarioSchema>
export type ScenarioLibrary = {
  version: 1
  activeId: string | null
  records: SavedScenario[]
}

export const emptyLibrary = (): ScenarioLibrary => ({ version: 1, activeId: null, records: [] })

export const readLibrary = (storage: Pick<Storage, 'getItem'> = window.localStorage): ScenarioLibrary => {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return emptyLibrary()

  try {
    const parsed = librarySchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return emptyLibrary()
    const records: SavedScenario[] = []
    for (const rawRecord of parsed.data.records) {
      const result = savedScenarioSchema.safeParse(rawRecord)
      if (result.success) records.push(result.data)
      if (records.length >= MAX_SAVED) break
    }
    const activeId = records.some((record) => record.id === parsed.data.activeId)
      ? parsed.data.activeId
      : null
    return { version: 1, activeId, records }
  } catch {
    return emptyLibrary()
  }
}

export const getActiveGraph = (library: ScenarioLibrary): ScenarioGraph | null =>
  library.records.find((record) => record.id === library.activeId)?.graph ?? null

export const saveGraph = (
  library: ScenarioLibrary,
  graph: ScenarioGraph,
  existingId: string | null = null,
): ScenarioLibrary => {
  const validated = scenarioGraphSchema.parse(graph)
  const id = existingId && library.records.some((record) => record.id === existingId)
    ? existingId
    : crypto.randomUUID()
  const record: SavedScenario = { id, savedAt: new Date().toISOString(), graph: validated }
  return {
    version: 1,
    activeId: id,
    records: [record, ...library.records.filter((item) => item.id !== id)].slice(0, MAX_SAVED),
  }
}

export const openSavedGraph = (library: ScenarioLibrary, id: string): ScenarioLibrary => ({
  ...library,
  activeId: library.records.some((record) => record.id === id) ? id : library.activeId,
})

export const closeGraph = (library: ScenarioLibrary): ScenarioLibrary => ({ ...library, activeId: null })

export const deleteSavedGraph = (library: ScenarioLibrary, id: string): ScenarioLibrary => ({
  ...library,
  activeId: library.activeId === id ? null : library.activeId,
  records: library.records.filter((record) => record.id !== id),
})

export const persistLibrary = (
  library: ScenarioLibrary,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) => storage.setItem(STORAGE_KEY, JSON.stringify(library))
