import { Box, IconButton, Text } from "@chakra-ui/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { fontSize, minNodeHeight, minNodeWidth } from "../../constants/nodesDefinitions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

interface BaseComponentProps {
  label: string;
  selected: boolean;
  color?: string;
  id?: string;
  parentOf?: string[];
}

export default function BaseComponent({ 
  label, 
  color = "#FFFFFF7F",
  selected,
  id,
  parentOf,
}: BaseComponentProps) {
  const [nodeHeight, setNodeHeight] = useState(minNodeHeight);
  const {deleteElements, getNode} = useReactFlow();
  
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  let svgWidth = minNodeWidth;
  if (context) {
    context.font = `${fontSize}px ${"Arial"}`;
    svgWidth = Math.max(context.measureText(label).width + 50, minNodeWidth);
  }
  
  const [nodeWidth, setNodeWidth] = useState(svgWidth);
  
  useEffect(() => {
  if(parentOf){
    let w = svgWidth;
    let h = minNodeHeight;
    for(let i = 0; i < parentOf.length; i++){
      const child = getNode(parentOf[i]);
      w += child?.measured?.width || minNodeWidth + 40;
      h += child?.measured?.height || minNodeHeight + 40;
    }
    setNodeWidth(w);
    setNodeHeight(h);
  }
}, [parentOf, getNode, svgWidth]);

  return (
    <Box
    border={`2px solid ${"black"}`}
    borderRadius="8px"
    height={nodeHeight}
    width={nodeWidth}
    bg = {color}
    {...(selected && { boxShadow: `${color} 0px 0px 4px` })}
    display="flex"         // Add display flex
    alignItems={parentOf && parentOf.length > 0 ? "flex-start" : "center"}    // Center items vertically
    justifyContent="center" // Center items horizontally
  >
    <Text fontSize={fontSize}>{label}</Text>

      { selected && id && (
        <IconButton
          position="absolute"
          top="-10px"
          right="-10px"
          size="xs"
          colorScheme="red"
          aria-label="Delete node"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering other click events
            console.log("Delete node with id: ", id);
            //setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
            const node = getNode(id);
            if (node) deleteElements({nodes: [node]});
          }}
          opacity={0.7}
          _hover={{ opacity: 1 }}
          borderRadius="full"
        >
          <FontAwesomeIcon icon={faTrash} />
        </IconButton>
      )}
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
    </Box>
  );
}