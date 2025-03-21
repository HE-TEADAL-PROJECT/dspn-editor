import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { baseEdgeStyle } from "../../constants/nodesDefinitions";

export default function RelationConnection({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [d] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return <BaseEdge path={d}
    markerEnd={markerEnd}
    style={baseEdgeStyle}
  />;
}