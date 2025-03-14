import { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
} from '@xyflow/react';
import { useDroppable } from '@dnd-kit/core';

import '@xyflow/react/dist/style.css';
import './Diagram.css';

//TODO set initial nodes and edges
const initialNodes = [{ id: '2', position: { x: 100, y: 100 }, data: { label: '2' }}];

const initialEdges = [];

const Diagram = ({ newNode }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
 
  // add the new edge to the diagram
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Droppable area for drag and drop
  const {isOver, setNodeRef} = useDroppable({
    id: 'diagram',
  });

  // Add new node to the state when updated from the parent component
  useEffect(() => {
    if (newNode) {
      setNodes(nds => [...nds, newNode]);
      console.log('newNode', newNode);
    }
  }, [newNode, setNodes]);

  return (
    <div className="diagram" ref={setNodeRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
      </ReactFlow>
    </div>
  );
};

export default Diagram;