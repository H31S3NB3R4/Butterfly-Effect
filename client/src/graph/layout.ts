import dagre from '@dagrejs/dagre'
import { MarkerType, type Edge, type Node } from '@xyflow/react'

import type { ConsequenceNode, ScenarioGraph } from '../types/graph'

export type ConsequenceNodeData = { consequence: ConsequenceNode; onSelect?: (id: string) => void }
export type ConsequenceFlowNode = Node<ConsequenceNodeData, 'consequence'>

const NODE_WIDTH = 220
const NODE_HEIGHT = 124

export const layoutGraph = (graph: ScenarioGraph) => {
  const layout = new dagre.graphlib.Graph()
  layout.setDefaultEdgeLabel(() => ({}))
  layout.setGraph({ rankdir: 'TB', ranksep: 68, nodesep: 22, marginx: 24, marginy: 24 })

  const sortedNodes = [...graph.nodes].sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id))
  const sortedEdges = [...graph.edges].sort((a, b) => a.id.localeCompare(b.id))

  sortedNodes.forEach((node) => layout.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  sortedEdges.forEach((edge) => layout.setEdge(edge.source, edge.target))
  dagre.layout(layout)

  const nodes: ConsequenceFlowNode[] = sortedNodes.map((consequence) => {
    const position = layout.node(consequence.id)
    return {
      id: consequence.id,
      type: 'consequence',
      ariaLabel: `${consequence.title}, depth ${consequence.depth}, ${consequence.impact} impact, ${consequence.uncertainty} uncertainty. Press Enter for details.`,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      data: { consequence },
    }
  })

  const edges: Edge[] = sortedEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    style: { stroke: '#475569', strokeWidth: 1.5 },
  }))

  return { nodes, edges }
}
