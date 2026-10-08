import type { SavedScenario } from '../storage/scenarios'

type Props = {
  records: SavedScenario[]
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function SavedScenarios({ records, onOpen, onDelete }: Props) {
  if (records.length === 0) return null

  return (
    <section className="mx-auto mt-8 w-full max-w-2xl text-left" aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Recent explorations
      </h2>
      <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {records.map((record) => (
          <li key={record.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2">
            <button
              type="button"
              onClick={() => onOpen(record.id)}
              className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-violet-400"
              aria-label={`Open ${record.graph.scenario}`}
            >
              <span className="block truncate text-sm font-medium text-slate-200">{record.graph.scenario}</span>
              <span className="mt-1 block text-xs text-slate-500">
                {record.graph.nodes.length} nodes · Saved {new Date(record.savedAt).toLocaleDateString()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              aria-label={`Delete ${record.graph.scenario}`}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-rose-400/10 hover:text-rose-200 focus-visible:outline-2 focus-visible:outline-rose-300"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
