import { Box, Button, Group, Textarea } from "@chakra-ui/react";
import { NodeData } from "../../types/nodeTypes";
import { useState, useEffect } from "react";

export const DefaultValueComponent = ({ node }: { node: NodeData }) => {
  const [textValue, setTextValue] = useState("Error: No value found");
  const [isDirty, setIsDirty] = useState(false);
  const [isChanged, setIsChanged] = useState(JSON.stringify(node.input?.value.value) !== JSON.stringify(node.output?.value.value));

  // Update text when node output changes
  useEffect(() => {
    if (node.output?.tag === 'Default' && node.output.value.value) {
      try {
        const jsonString = JSON.stringify(node.output.value.value, null, 2);
        setTextValue(jsonString);
      } catch (error) {
        setTextValue("Error: No value found");
        console.error("Error converting node value to string:", error);
      }
    } else {
      setTextValue("Error: No value found");
    }
  }, [node.output]);

  const handleSave = (newObject: string) => {
    try {
      const parsedObject = JSON.parse(newObject);
      if(node.output?.tag === 'Default'){
        node.output.value.value = parsedObject;
      }
    }
    catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  const handleRevert = () => {
    if (node.input?.value.value && node.output?.value) {
      node.output.value.value = node.input.value.value;
    }
  }

  return (
    <Box>
      <Textarea
        value={textValue}
        onChange={(e) => {
          setTextValue(e.target.value);
          setIsDirty(true);
          setIsChanged(true);
        }}
        minHeight="200px"
        fontFamily="monospace"
        fontSize="sm"
        p={2}
        mb={3}
      />
      <Group attached w="full" maxW="sm">
      <Button 
        bg="bg.subtle"
        variant="outline"
        size="md" 
        width="50%"
        onClick={() => {
          handleRevert();
          setTextValue(JSON.stringify(node.input?.value.value, null, 2));
          setIsDirty(false);
          setIsChanged(false);
        }}
        disabled={!isChanged}
      >
        Revert Changes
      </Button>

      <Button 
        bg="bg.subtle"
        variant="outline"
        size="md" 
        width="50%"
        onClick={() => {
          handleSave(textValue);
          setIsChanged(true);
          setIsDirty(false);
        }}
        disabled={!isDirty}
      >
        Save Changes
      </Button>
      </Group>
    </Box>
  );
}