import { Flex, Box, IconButton } from "@chakra-ui/react";
import { DEFAULT_COMPONENTS, INPUT_COMPONENTS, OUTPUT_COMPONENTS, POLICY_COMPONENTS } from "../constants/components";
import { NodeType, NodeData, PolicyNodeValue } from "../types/nodeTypes";
interface PanelSingleComponentsProps {
  componentType: NodeType;
  onDragFunc: (event: React.DragEvent<HTMLDivElement> | React.DragEvent<HTMLButtonElement>, node: NodeData) => void;
}

export default function PanelSingleComponents({ componentType, onDragFunc }: PanelSingleComponentsProps) {
  let components = [];
  switch (componentType) {
    case NodeType.Input:
      components = INPUT_COMPONENTS;
      break;
    case NodeType.Policy:
      components = POLICY_COMPONENTS;
      break;
    case NodeType.Output:
      components = OUTPUT_COMPONENTS;
      break;
    case NodeType.Default:
      components = DEFAULT_COMPONENTS;
      break;
  }

  const outputList: NodeData[] = [];
  components.forEach((item) => {
    let value;
    if(componentType === NodeType.Policy) {
      value = {policy: ''} as PolicyNodeValue;
    }

    outputList.push({
      label: item.label,
      type: componentType,
      subType: item.type,
      value: value,
      parentOf: [],
    });
  });

  return (
    <Flex mt={1} gap={1} flexWrap="wrap">
        {outputList.map((component, index) => (
          <Box
          background={"transparent"}
          borderRadius= "5px"
          _hover={{ bg: "gray.100" }}
          key={component.subType}
          >
            <IconButton
            size="sm"
            aria-label={component.label}
            variant="outline"
            draggable={components[index].available}
            onDragStart={(e) => onDragFunc(e, component)}
            title={component.label}
            m={1}
            backgroundColor={components[index].available? "transparent": "gray"}
            
          >
            {components[index].icon}
          </IconButton>
          </Box>//</div>
        ))}
    </Flex>
  );
}