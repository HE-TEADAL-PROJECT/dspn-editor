import { Panel } from "@xyflow/react";
import { NodeData, NodeType } from "../../types/nodeTypes";
import { Box, Heading,} from "@chakra-ui/react";
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { PolicyValueComponent } from "./PolicyValueComponent";

interface RightPanelProps {
  node: NodeData;
}

export default function RightPanel({node}: RightPanelProps) {
  let hasValue = false;
  let nodeValueComponent;

  switch (node.type) {
    case NodeType.Policy:
      nodeValueComponent = <PolicyValueComponent node={node} />;
      hasValue = true;
      break;
  }
  
  return (
    <Panel
      position="top-right"
      style={{
        border: "1px solid black",
        padding: "10px",
        background: "white",
        width: "fit-content",
        maxWidth: "400px",
        maxHeight: "80vh",
        overflow: "auto"
      }}
    >
      <Box padding="10px">
        <Heading size="md" textAlign="center">{node.type} {node.label}</Heading>

        {hasValue && 
        <>
          {nodeValueComponent}  
        </>}

        {node.output &&
        <>
          <Heading size="sm" mt={4} mb={2}> Output:</Heading>
          <Box 
            borderRadius="md"
            overflow="auto"
          >
            <JsonView 
              data={node.output?.value} 
              shouldExpandNode={(level: number) => level < 1}
            />
          </Box>
        </>}
        
        { /* [TODO]: Remove */}
        <Heading size="sm" mt={4} mb={2}> {node.label} Properties:</Heading>
        <Box 
          borderRadius="md"
          overflow="auto"
        >
          <JsonView 
            data={node} 
            shouldExpandNode={(level: number) => level < 1}
          />
        </Box>
      </Box>
    </Panel>
  );
}