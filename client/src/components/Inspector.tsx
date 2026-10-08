import type { ScenarioGraph } from '../types/graph'

type Props = {
  graph: ScenarioGraph
  selectedNodeId: string | null
}

export function Inspector({ graph, selectedNodeId }: Props) {
  const node = graph.nodes.find((item) => item.id === selectedNodeId) ?? graph.nodes[0]
  const incoming = graph.edges.filter((edge) => edge.target === node.id)

  return (
    <aside className="w-full shrink-0 overflow-y-auto border-t border-white/10 bg-[#0c111c] p-6 lg:h-full lg:w-[360px] lg:border-l lg:border-t-0">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Consequence details</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{node.title}</h2>
      <div className="mt-4 flex flex-wrap gap-2 text-xs capitalize">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">Depth {node.depth}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">{node.impact} impact</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">{node.uncertainty} uncertainty</span>
      </div>

      <section className="mt-7">
        <h3 className="text-sm font-semibold text-slate-200">Why this could happen</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{node.description}</p>
        {incoming.map((edge) => (
          <p key={edge.id} className="mt-3 border-l-2 border-violet-400/40 pl-3 text-sm leading-6 text-slate-300">
            {edge.explanation}
          </p>
        ))}
      </section>

      <section className="mt-7">
        <h3 className="text-sm font-semibold text-slate-200">Assumptions</h3>
        <ul className="mt-3 space-y-2">
          {node.assumptions.map((assumption) => (
            <li key={assumption} className="flex gap-2 text-sm leading-5 text-slate-400">
              <span className="text-violet-300">◇</span>{assumption}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100/70">
        Impact and uncertainty are qualitative AI labels, not measured probabilities.
      </div>
      {node.depth > 0 && (
        <button type="button" disabled className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-500">
          Expand this branch · Phase 4
        </button>
      )}
    </aside>
  )
}
