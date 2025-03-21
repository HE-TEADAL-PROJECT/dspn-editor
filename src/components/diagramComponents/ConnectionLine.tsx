import { ConnectionLineComponentProps, getSmoothStepPath } from "@xyflow/react";
import { baseEdgeStyle } from "../../constants/nodesDefinitions";

export default function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionStatus
}: ConnectionLineComponentProps) {
  const [d] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  let color = baseEdgeStyle.stroke;
  if (connectionStatus === 'invalid') color = 'red';
  if (connectionStatus === 'valid') color = 'green';

  let width = baseEdgeStyle.strokeWidth;
  if (connectionStatus) width = baseEdgeStyle.strokeWidth * 2;

  return <path d={d} style={{...baseEdgeStyle, strokeWidth: width, stroke: color}} />;
}