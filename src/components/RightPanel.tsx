import { Panel } from "@xyflow/react";
import { NodeData, NodeType, PolicyNodeValue } from "../types/nodeTypes";
import { Box, Heading, Input } from "@chakra-ui/react";
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { useState, useEffect } from 'react';

// Convert to a proper React component with its own state
const PolicyValueComponent = ({ node }: { node: NodeData }) => {
  const [value, setValue] = useState((node.expression as PolicyNodeValue)?.policy || '');
  
  // Update local state when node changes
  useEffect(() => {
    setValue((node.expression as PolicyNodeValue)?.policy || '');
  }, [node]);
  
  return (
    <Input
      id="fname"
      name="fname"
      value={value} 
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      _hover={{ borderColor: "blue.300" }}
      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
      onChange={(e) => {
        setValue(e.target.value);
        //Set the value in the node expression, if it's the first time, create the expression object
        if (!node.expression) {
          node.expression = { policy: e.target.value };
        } else {
          (node.expression as PolicyNodeValue).policy = e.target.value;
        }
        if(node.output) {
          node.output.value.name = e.target.value; // Clear the output if the expression changes
        }
      }}
    />
  );
}

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
          <Heading size="sm" mt={4} mb={2}> Expression:</Heading>
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