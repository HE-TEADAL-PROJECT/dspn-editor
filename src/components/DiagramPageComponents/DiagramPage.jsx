import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';

import '../../css/DiagramPage.css';
import Diagram from './Diagram';
import LeftDrawer from './LeftDrawer';
import PolicyPalette from './PolicyPalette';
import { useReactFlow } from '@xyflow/react';

const DiagramPage = () => {
  const [newNode, setNewNode] = useState(null); // State to store the new node created by drag and drop
  const {screenToFlowPosition} = useReactFlow();

  const handleDragEnd = (event) => {
    console.log('event', event);
    const { over, active } = event;
    if (over && over.id === 'diagram') {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const draggedNode = {
        id: `${active.id}-${new Date().getTime()}`, // TODO ID
        position,
        data: { label: active.data.current.policy.name }, // TODO data, type...
      };
      // Pass the new node to the Diagram component
      setNewNode(draggedNode);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="diagram-page">
        <LeftDrawer />
        <div className="diagram-container">
          <Diagram newNode={newNode}/>
        </div>
        <PolicyPalette />
      </div>
    </DndContext>
  );
};

export default DiagramPage;