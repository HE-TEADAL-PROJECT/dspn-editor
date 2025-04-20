import { MarkerType } from "@xyflow/react";

/*

  This file contains the definitions of the nodes and the edges of the workflow diagram.

  Other things that can be easily changed are:
  - The handles of the nodes (Handle)
  - Connection line between nodes before the edge is created (ConnectionLine)

*/


export const minNodeWidth = 125;
export const minNodeHeight = 75;
export const nodeBorderRadius = 15;
export const fontSize = 16;

// Nodes colors
export const inputColor = "#a8e481";
//export const inputColor = "#08A5087F";
export const policyColor = "#F3E75A";
//export const policyColor = "#FFFF007F";
export const outputColor = "#f35246";
//export const outputColor = "#FF00007F";
export const defaultColor = "#FFA822";

// Connection between nodes
export const baseEdgeStyle = { fill: 'none', stroke: 'black', strokeWidth: 1 };
export const baseMarkerEnd = {
  type: MarkerType.Arrow,
  width: 20,
  height: 20,
  color: 'black',
};

export const baseMarkerStart = {
  type: MarkerType.ArrowClosed,
  orient: 'auto-start-reverse', // This is often missing
  width: 20,
  height: 20,
  color: 'black',
};

export const diamondMarkerDef = () => {
   return (
    <defs>
      <marker
        id="diamond"
        viewBox="-6 -6 12 12"
        refX="-2"
        refY="0"
        markerWidth="15"
        markerHeight="15"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path 
          d="M0,-5L5,0L0,5L-5,0Z" 
          fill="black" 
          stroke="none"
        />
      </marker>
    </defs>
   );
}

export const emptyArrowMarkerDef = () => {
  return (
    <defs>
      <marker
        id="empty-arrow"
        viewBox="0 -5 10 10"
        refX="8"
        refY="0"
        markerWidth="10"
        markerHeight="10"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path 
          d="M0,-4L8,0L0,4z"
          fill="white" 
          stroke="black"
          strokeWidth="1.5"
        />
      </marker>
    </defs>
  );
}