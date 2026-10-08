import { Handle, Position, type NodeProps } from '@xyflow/react'

import type { ConsequenceFlowNode } from '../graph/layout'

const depthStyles = [
  'border-violet-300/60 bg-violet-500/20',
  'border-cyan-300/35 bg-cyan-500/10',
  'border-amber-300/35 bg-amber-500/10',
  'border-fuchsia-300/35 bg-fuchsia-500/10',
]

export function ConsequenceCard({ data, selected }: NodeProps<ConsequenceFlowNode>) {
  const { consequence } = data
  return (
    <article className={`h-[132px] w-[236px] rounded-2xl border p-4 text-left shadow-xl shadow-black/30 transition ${depthStyles[consequence.depth] ?? depthStyles[3]} ${selected ? 'ring-2 ring-white/80 ring-offset-4 ring-offset-slate-950' : ''}`}>
      {consequence.depth > 0 && <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-slate-400" />}
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span>{consequence.depth === 0 ? 'Scenario' : `Depth ${consequence.depth}`}</span>
        <span className="rounded-full bg-black/20 px-2 py-1 tracking-normal text-slate-300">{consequence.impact} impact</span>
      </div>
      <h3 className="mt-3 line-clamp-3 text-[15px] font-semibold leading-5 text-white">{consequence.title}</h3>
      <p className="mt-2 text-[11px] capitalize text-slate-400">{consequence.category} · {consequence.uncertainty} uncertainty</p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-slate-400" />
    </article>
  )
}
