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
export const inputColor = "#08A5087F";
export const policyColor = "#FFFF007F";
export const outputColor = "#FF00007F";

// Connection between nodes
export const baseEdgeStyle = { fill: 'none', stroke: 'black', strokeWidth: 1 };
export const baseMarkerEnd = {
  type: MarkerType.ArrowClosed,
  width: 20,
  height: 20,
  color: 'black',
};