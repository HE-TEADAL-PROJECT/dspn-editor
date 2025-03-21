import React, { useState, useRef, useEffect, useContext } from "react";
import { Flex, IconButton, Text, Box } from "@chakra-ui/react";
import { Panel } from "@xyflow/react";
import { INPUT_COMPONENTS } from "../constants/components";
import { InputNodeType, nodeComponent, NodeType } from "../types/nodeTypes";
import PanelActions from "./PanelActions";
import { GlobalContext } from "./GlobalContext";

interface LeftPanelProps {
  onDragFunc: (event: React.DragEvent<HTMLDivElement>, node: nodeComponent) => void;
}

interface DropdownMenuProps {
  component: { label: string; type: InputNodeType; icon: React.ReactNode };
  onDragFunc: (event: React.DragEvent<HTMLDivElement>, node: nodeComponent) => void;
  menuList: nodeComponent[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ component, onDragFunc, menuList }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isMenuOpen, setIsMenuOpen } = useContext(GlobalContext);

  const toggleDropdown = () => setOpen((prev) => !prev);

  useEffect(() => {
    if(!isMenuOpen) {
      console.log("Closing dropdown");
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
      <IconButton size="sm" aria-label={component.label} onClick={toggleDropdown} style={{ background: "transparent" }}>
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
          {menuList.filter((item) => item.canBeAdded).map((item, idx) => (
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

export default function LeftPanel({ onDragFunc }: LeftPanelProps) {
  const { resourceInputs, resourceSchemaInputs, resourceFieldInputs } = useContext(GlobalContext);

  const getMenuList = (type: NodeType, subType: InputNodeType) => {
    let list: nodeComponent[] = [];

    if(type === NodeType.Input) {
      switch(subType) {
        case InputNodeType.Resource:
          list = resourceInputs;
          break;
        case InputNodeType.Schema:
          list = resourceSchemaInputs;
          break;
        case InputNodeType.Field:
          list = resourceFieldInputs;
          break
      }
      list = list.filter((item) => item.canBeAdded);
    }

    return list;
  }


  return (
    <Panel
      position="top-left"
      style={{
        border: "1px solid black",
        padding: "10px",
        background: "white",
        width: "fit-content",
      }}
    >
      <Flex direction="column" gap={2}>
        <div>
          <Text fontSize="x-small">Actions</Text>
          <PanelActions />
        </div>
        <div>
          <Text fontSize="x-small">Components</Text>
          <Flex mt={1} gap={1} flexWrap="wrap">
              {INPUT_COMPONENTS.map((component) => (
                /*<div  
                style={{
                  background:  getMenuList(NodeType.Input, component.type).length === 0 ? "gray" : "transparent", 
                  borderRadius: "5px",
                  
                }}>*/
               <Box
                background={getMenuList(NodeType.Input, component.type).length === 0 ? "gray" : "transparent"}
                borderRadius= "5px"
                _hover={{ bg: "gray.100" }}
                key={component.type}
               >
                  <DropdownMenu
                    key={component.type}
                    component={component}
                    onDragFunc={onDragFunc}
                    menuList={getMenuList(NodeType.Input, component.type)}
                  />
                </Box>//</div>
              ))}
          </Flex>
        </div>
      </Flex>
    </Panel>
  );
}
