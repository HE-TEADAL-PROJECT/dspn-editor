import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import PanelActions from "./PanelActions";
import { Panel } from "@xyflow/react";
import { NodeData, NodeType } from "../../types/nodeTypes";
import PanelComponents from "./PanelComponents";
import PanelSingleComponents from "./PanelSingleComponent";

interface LeftPanelProps {
  onDragFunc: (event: React.DragEvent<HTMLDivElement> | React.DragEvent<HTMLButtonElement>, node: NodeData) => void;
}

export default function LeftPanel({ onDragFunc }: LeftPanelProps) {
  return (
    <Panel
      position="top-left"
      style={{
        border: "1px solid black",
        padding: "10px",
        background: "white",
        width: "210px",
      }}
    >
      <Flex direction="column" gap={2}>
        <div>
          <Text fontSize="x-small">Actions</Text>
          <PanelActions />
        </div>
        <div>
          <Text fontSize="x-small">Input Components</Text>
          <PanelComponents componentType={NodeType.Input} onDragFunc={onDragFunc} />
        </div>
        <div>
          <Text fontSize="x-small">Default Components</Text>
          <PanelSingleComponents componentType={NodeType.Default} onDragFunc={onDragFunc} />
        </div>
        <div>
          <Text fontSize="x-small">Policy Components</Text>
          <PanelSingleComponents componentType={NodeType.Policy} onDragFunc={onDragFunc} />
        </div>
        <div>
          <Text fontSize="x-small">Output Components</Text>
          <PanelSingleComponents componentType={NodeType.Output} onDragFunc={onDragFunc} />
        </div>
      </Flex>
    </Panel>
  );
}