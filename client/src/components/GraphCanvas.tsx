import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { layoutGraph, type ConsequenceNodeData } from '../graph/layout'
import type { ScenarioGraph } from '../types/graph'
import { ConsequenceCard } from './ConsequenceCard'

const nodeTypes = { consequence: ConsequenceCard }

type Props = {
  graph: ScenarioGraph
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
}

export function GraphCanvas({ graph, selectedNodeId, onSelectNode }: Props) {
  const elements = useMemo(() => layoutGraph(graph), [graph])
  const nodes = useMemo(
    () => elements.nodes.map((node) => ({ ...node, selected: node.id === selectedNodeId })),
    [elements.nodes, selectedNodeId],
  )
  const onNodeClick: NodeMouseHandler = (_event, node) => onSelectNode(node.id)

  return (
    <div className="h-[560px] min-h-[560px] w-full bg-[#070a12] lg:h-full lg:min-h-0">
      <ReactFlow
        key={graph.nodes.length}
        nodes={nodes}
        edges={elements.edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        aria-label="Causal consequence graph"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          bgColor="#111827"
          maskColor="rgba(7, 10, 18, 0.72)"
          nodeColor={(node) => {
            const depth = (node.data as ConsequenceNodeData | undefined)?.consequence.depth ?? 0
            return ['#8b5cf6', '#06b6d4', '#f59e0b', '#d946ef'][depth] ?? '#d946ef'
          }}
        />
      </ReactFlow>
    </div>
  )
}
