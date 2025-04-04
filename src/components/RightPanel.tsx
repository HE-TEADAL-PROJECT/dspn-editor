import { Panel } from "@xyflow/react";
import { NodeData } from "../types/nodeTypes";

interface RightPanelProps {
  node: NodeData;
}

export default function RightPanel({node}: RightPanelProps) {
  return (
    <Panel
      position="top-right"
      style={{
        border: "1px solid black",
        padding: "10px",
        background: "white",
        width: "fit-content",
      }}
    >
      <div style={{ padding: "10px" }}>
        <h3> {node.type} {node.label}</h3>
        <p>This is the right panel.</p>
      </div>
      <div style={{ padding: "10px" }}>
        <h3>Right Panel Content</h3>
        <p>You can add any content you want here.</p>
      </div>
    </Panel>
  );
}