import { Flex, Box, IconButton } from "@chakra-ui/react";
import { DEFAULT_COMPONENTS, INPUT_COMPONENTS, OUTPUT_COMPONENTS, POLICY_COMPONENTS } from "../../constants/components";
import { NodeType, NodeData, PolicyNodeValue } from "../../types/nodeTypes";
import httpRequestData from '../../components/defaultComponents/httpRequest.json';
import platformData from '../../components/defaultComponents/platform.json';
import userData from '../../components/defaultComponents/user.json';
import { DefaultItem } from "../../types/componentTypes";

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
    let outputValue;
    if(componentType === NodeType.Policy) {
      value = {policy: ''} as PolicyNodeValue;
    }
    
    if(componentType === NodeType.Default) {
      switch (item.type) {
        case "Request":
          outputValue = {
            tag: "Default",
            name: item.label,
            label: item.label,
            index: 0,
            value: {
              name: "httpRequest",
              value: { ...httpRequestData }, // Ensure it matches DefaultValue structure
            },
            original: item.label,
            canBeAdded: true,
          };
          break;
        case "Platform":
          outputValue = {
            tag: "Default",
            name: item.label,
            label: item.label,
            index: 0,
            value: {
              name: "platform",
              value: { ...platformData }, // Ensure it matches DefaultValue structure
            },
            original: item.label,
            canBeAdded: true,
          };
          break;
        case "User":
          outputValue = {
            tag: "Default",
            name: item.label,
            label: item.label,
            index: 0,
            value: {
              name: "user",
              value: { ...userData }, // Ensure it matches DefaultValue structure
            },
            original: item.label,
            canBeAdded: true,
          };
          break;
      }

      outputList.push({
        label: item.label,
        type: componentType,
        subType: item.type,
        expression: value,
        input: JSON.parse(JSON.stringify(outputValue)) as DefaultItem, // Deep copy 
        output: JSON.parse(JSON.stringify(outputValue)) as DefaultItem, // Deep copy
        parentOf: [],
      });
    }
    else{
      outputList.push({
        label: item.label,
        type: componentType,
        subType: item.type,
        expression: value,
        parentOf: [],
      });
    }
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