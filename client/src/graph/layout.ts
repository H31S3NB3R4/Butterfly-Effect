import dagre from '@dagrejs/dagre'
import { MarkerType, type Edge, type Node } from '@xyflow/react'

import type { ConsequenceNode, ScenarioGraph } from '../types/graph'

export type ConsequenceNodeData = { consequence: ConsequenceNode }
export type ConsequenceFlowNode = Node<ConsequenceNodeData, 'consequence'>

const NODE_WIDTH = 236
const NODE_HEIGHT = 132

export const layoutGraph = (graph: ScenarioGraph) => {
  const layout = new dagre.graphlib.Graph()
  layout.setDefaultEdgeLabel(() => ({}))
  layout.setGraph({ rankdir: 'TB', ranksep: 96, nodesep: 46, marginx: 40, marginy: 40 })

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
