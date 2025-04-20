import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { baseEdgeStyle, diamondMarkerDef, emptyArrowMarkerDef } from "../../constants/nodesDefinitions";

export default function RelationConnection({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  markerStart,
}: EdgeProps) {
  const [d] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {diamondMarkerDef()}
      {emptyArrowMarkerDef()}

      <BaseEdge path={d}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={baseEdgeStyle}
      />
    </>
  );
}