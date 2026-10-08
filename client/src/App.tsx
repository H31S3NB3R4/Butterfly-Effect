import { useState } from 'react'

import { analyzeScenario, expandScenario } from './api/scenarios'
import { GraphCanvas } from './components/GraphCanvas'
import { Inspector } from './components/Inspector'
import { SavedScenarios } from './components/SavedScenarios'
import { ScenarioComposer } from './components/ScenarioComposer'
import {
  closeGraph,
  deleteSavedGraph,
  emptyLibrary,
  getActiveGraph,
  openSavedGraph,
  persistLibrary,
  readLibrary,
  saveGraph,
  type ScenarioLibrary,
} from './storage/scenarios'

const loadInitialLibrary = (): ScenarioLibrary => {
  try { return readLibrary() } catch { return emptyLibrary() }
}

function App() {
  const [library, setLibrary] = useState(loadInitialLibrary)
  const graph = getActiveGraph(library)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [lastScenario, setLastScenario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null)
  const [expansionError, setExpansionError] = useState<string | null>(null)
  const [expansionSuccess, setExpansionSuccess] = useState<string | null>(null)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)

  const updateLibrary = (next: ScenarioLibrary) => {
    setLibrary(next)
    try {
      persistLibrary(next)
      setStorageWarning(null)
    } catch {
      setStorageWarning('Browser storage is unavailable. This exploration may not survive a refresh.')
    }
  }

  const explore = async (scenario: string) => {
    setLoading(true)
    setError(null)
    setLastScenario(scenario)
    try {
      const result = await analyzeScenario(scenario)
      updateLibrary(saveGraph(library, result))
      setSelectedNodeId(result.nodes.find((node) => node.depth === 0)?.id ?? result.nodes[0]?.id ?? null)
      setMobileInspectorOpen(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    updateLibrary(closeGraph(library))
    setSelectedNodeId(null)
    setError(null)
    setExpansionError(null)
    setExpansionSuccess(null)
    setMobileInspectorOpen(false)
  }

  const openSaved = (id: string) => {
    updateLibrary(openSavedGraph(library, id))
    setSelectedNodeId(null)
    setExpansionError(null)
    setExpansionSuccess(null)
    setMobileInspectorOpen(false)
  }

  const deleteSaved = (id: string) => updateLibrary(deleteSavedGraph(library, id))

  const selectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    setExpansionError(null)
    setExpansionSuccess(null)
    setMobileInspectorOpen(true)
  }

  const expandBranch = async () => {
    if (!graph || !selectedNodeId || expandingNodeId) return
    setExpandingNodeId(selectedNodeId)
    setExpansionError(null)
    setExpansionSuccess(null)
    try {
      const expandedGraph = await expandScenario(graph, selectedNodeId)
      const addedCount = expandedGraph.nodes.length - graph.nodes.length
      updateLibrary(saveGraph(library, expandedGraph, library.activeId))
      setExpansionSuccess(`Added ${addedCount} new downstream consequences.`)
    } catch (requestError) {
      setExpansionError(requestError instanceof Error ? requestError.message : 'This branch could not be expanded. Please retry.')
    } finally {
      setExpandingNodeId(null)
    }
  }

  if (!graph) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,_rgba(124,58,237,0.25),_transparent_38%),radial-gradient(circle_at_15%_75%,_rgba(8,145,178,0.1),_transparent_28%)]" />
        <section className="w-full max-w-3xl text-center">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-400/10 text-3xl shadow-2xl shadow-violet-950/50">🦋</div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-violet-300">Butterfly Effect</p>
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.04em] text-white sm:text-7xl">One change. Infinite possibilities.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">Map the immediate, secondary, and long-term ripples of a hypothetical change with Gemini.</p>
          <div className="mx-auto mt-10 max-w-2xl">
            <ScenarioComposer loading={loading} error={error} initialScenario={lastScenario} onSubmit={explore} />
          </div>
          <SavedScenarios records={library.records} onOpen={openSaved} onDelete={deleteSaved} />
          {storageWarning && <p role="status" className="mx-auto mt-4 max-w-2xl text-sm text-amber-200">{storageWarning}</p>}
          <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-slate-500">AI-generated consequences are conditional thought experiments—not forecasts, verified facts, or calibrated probabilities.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#070a12] text-slate-100 lg:h-screen lg:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0a0e18]/95 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10">🦋</div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Butterfly Effect</p>
            <h1 className="truncate text-sm font-medium text-slate-300">{graph.scenario}</h1>
          </div>
        </div>
        <button type="button" onClick={reset} disabled={Boolean(expandingNodeId)} className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-50">
          New scenario
        </button>
      </header>

      <div className="border-b border-white/10 bg-violet-400/[0.05] px-4 py-2 text-center text-xs text-slate-400">
        A hypothetical exploration generated by AI. Select a node to inspect its reasoning and assumptions.
      </div>
      {storageWarning && <p role="status" className="border-b border-amber-300/20 bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-200">{storageWarning}</p>}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-[560px] min-w-0 flex-1 lg:min-h-0" aria-label="Graph explorer">
          <GraphCanvas graph={graph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
        </section>
        <Inspector
          graph={graph}
          selectedNodeId={selectedNodeId}
          expanding={expandingNodeId === selectedNodeId}
          error={expansionError}
          success={expansionSuccess}
          onExpand={expandBranch}
          mobileOpen={mobileInspectorOpen}
          onToggleMobile={() => setMobileInspectorOpen((open) => !open)}
        />
      </div>
    </main>
  )
}

export default App
