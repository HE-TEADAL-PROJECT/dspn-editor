import React, { useState, useRef, useEffect, useContext } from "react";
import { Flex, IconButton, Box } from "@chakra-ui/react";
import { INPUT_COMPONENTS, OUTPUT_COMPONENTS } from "../constants/components";
import { InputNodeType, NodeData, NodeType, OutputNodeType, PolicyNodeType } from "../types/nodeTypes";
import { GlobalContext } from "./GlobalContext";
import { FieldItem, ResourceItem, ResponseItem } from "../types/componentTypes";

interface PanelComponentsProps {
  componentType: NodeType;
  onDragFunc: (event: React.DragEvent<HTMLDivElement>, node: NodeData) => void;
}

interface DropdownMenuProps {
  component: { label: string; type: InputNodeType | OutputNodeType; icon: React.ReactNode };
  onDragFunc: (event: React.DragEvent<HTMLDivElement>, node: NodeData) => void;
  menuList: NodeData[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ component, onDragFunc, menuList }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isMenuOpen, setIsMenuOpen } = useContext(GlobalContext);

  const toggleDropdown = () => setOpen((prev) => !prev);

  useEffect(() => {
    if(!isMenuOpen) {
      setOpen(false);
    }
  }, [isMenuOpen]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    setIsMenuOpen(open);

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setIsMenuOpen]);

  return (
    <Box position="relative" display="inline-block" m="1px" ref={dropdownRef}>
      <IconButton
        size="sm"
        aria-label={component.label}
        onClick={toggleDropdown}
        draggable={false}
        style={{ background: "transparent" }}
      >
        {component.icon}
      </IconButton>
      {open && (
        <Box
          position="absolute"
          top="45px"
          left="0"
          bg="white"
          border="1px solid #ccc"
          boxShadow="0px 2px 6px rgba(0,0,0,0.2)"
          zIndex="1000"
          width="fit-content"
          maxH="150px"           // Maximum height of the dropdown menu
          overflowY="auto"       // Enables vertical scrolling when content exceeds maxH
        >
          {menuList.filter((item) => item.output?.canBeAdded).map((item, idx) => (
            <Box
              as="button"
              key={idx}
              draggable
              onDragStart={(e) => onDragFunc(e, item)}
              onDragEnd={() => setIsMenuOpen(false)}
              width="100%"
              p="1px"
              border="none"
              bg="transparent"
              textAlign="left"
              cursor="grab"
              _hover={{ bg: "gray.100" }}
            >
              {item.label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

function getInputEntries(list: ResourceItem[] | ResponseItem[] | FieldItem[], inputSubType: InputNodeType) {
  const outputList: NodeData[] = [];
  list.forEach((item) => {
    outputList.push({
      label: item.label,
      type: NodeType.Input,
      subType: inputSubType,
      value: { input: item },
      output: item,
      parentOf: [],
    });
  });
  return outputList.filter((item) => item.output?.canBeAdded);
}


export default function PanelComponents({ componentType, onDragFunc }: PanelComponentsProps) {
  const { resourceInputs, resourceResponseInputs, resourceParametersInputs, resourceFieldInputs } = useContext(GlobalContext);

  const getMenuList = (type: NodeType, subType: InputNodeType | PolicyNodeType | OutputNodeType) => {
    let list: NodeData[] = [];

    if(type === NodeType.Input) {
      switch(subType) {
        case InputNodeType.Resource:
          list = getInputEntries(resourceInputs, InputNodeType.Resource);
          break;
        case InputNodeType.Response:
          list = getInputEntries(resourceResponseInputs, InputNodeType.Response);
          break;
        case InputNodeType.Field:
          list = getInputEntries(resourceFieldInputs, InputNodeType.Field);
          break
        case InputNodeType.Parameter:
          list = getInputEntries(resourceParametersInputs, InputNodeType.Parameter);
          break;
      }
    }

    return list;
  }

  const components = componentType === NodeType.Input ? INPUT_COMPONENTS : OUTPUT_COMPONENTS;

  return (
    <Flex mt={1} gap={1} flexWrap="wrap">
        {components.map((component) => (
          /*<div  
          style={{
            background:  getMenuList(NodeType.Input, component.type).length === 0 ? "gray" : "transparent", 
            borderRadius: "5px",
            
          }}>*/
          <Box
          background={getMenuList(componentType, component.type).length === 0 ? "gray" : "transparent"}
          borderRadius= "5px"
          _hover={{ bg: "gray.100" }}
          key={component.type}
          m={1}
          >
            <DropdownMenu
              key={component.type}
              component={component}
              onDragFunc={onDragFunc}
              menuList={getMenuList(componentType, component.type)}
            />
          </Box>//</div>
        ))}
    </Flex>
  );
}
