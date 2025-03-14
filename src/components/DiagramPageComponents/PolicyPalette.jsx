import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import './PolicyPalette.css';

const policies = [
  { id: '1', name: 'Policy 1' },
  { id: '2', name: 'Policy 2' },
  { id: '3', name: 'Policy 3' },
];

const DraggablePolicy = ({ policy }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: policy.id,
    data: { policy },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: transform ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {policy.name}
    </li>
  );
};

const PolicyPalette = () => {
  return (
    <div className="policy-palette">
      <h2>Policy Palette</h2>
      <ul>
        {policies.map((policy) => (
          <DraggablePolicy key={policy.id} policy={policy} />
        ))}
      </ul>
    </div>
  );
};

export default PolicyPalette;