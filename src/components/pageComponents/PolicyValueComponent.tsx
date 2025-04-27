import { Group, Input, Button, Heading } from "@chakra-ui/react";
import { useState } from "react";
import { NodeData, PolicyNodeType, PolicyNodeValue } from "../../types/nodeTypes";
import { Property, Schema } from "../../types/OpenAPI";

export const PolicyValueComponent = ({ node,}: { node: NodeData }) => {

  const handleSave = (expr:string, secondValue:boolean = false) => {
    if(secondValue){
      if(node.subType === PolicyNodeType.Encryption){
        // Save the encryption algorithm in the node expression
        if (!node.expression) {
          node.expression = { policy:'', encryptionAlgorithm: expr };
        } else {
          (node.expression as PolicyNodeValue).encryptionAlgorithm = expr;
        }
      }
      return;
    }

    // If not second value: save the value in the node expression
    if (!node.expression) {
      node.expression = { policy: expr };
    } else {
      (node.expression as PolicyNodeValue).policy = expr;
    }
    
    // Update output if needed
    if(node.output) {
      switch (node.subType as PolicyNodeType){
        case PolicyNodeType.Rename:
          handleRename();
          break;
        case PolicyNodeType.Projection:
          handleProjection();
          break;
        default:
          console.error("Unknown policy node type:", node.subType);
          return;
      }

      //[TODO]: Update the input value of the possible connected nodes
    }
  };
  
  const handleRename = () => {
    // Split the policy string by semicolon to get individual expressions
    const expressions: string[] = (node.expression as PolicyNodeValue).policy.split(';');

    if(node.output?.tag === 'Resource'){
      for (const expression of expressions) {
        const [oldName, newName] = expression.split(':').map(s => s.trim());
        
        if (!oldName || !newName){ // If it's a single name it's a rename of the value:
          node.output!.value.name = expression;
          (node.expression as PolicyNodeValue).policy = expression; // Keep the last valid expression in the policy as the expression
        }
      }
    }
    else if(node.output?.tag === 'Response') {
      //Retrieve the schema making a deep copy of it:
      const schema = JSON.parse(JSON.stringify(node.input?.value.value)) as Schema;
      
      for (const expression of expressions) {
        const [oldName, newName] = expression.split(':').map(s => s.trim());
        
        if (!newName){ // If no newName, assume it's a single name and so it's a rename of the value:
          node.output!.value.name = expression;
        }
        else if (oldName && newName) { // If there are two names, assume it's a rename of the value:      
          const properties: { [propertyName: string]: Property } = schema.properties || schema.items?.properties || {};
          // Check if the oldName exists in the properties
          
          if (properties[oldName]) {
            // Get the property keys to preserve order
            const propertyKeys = Object.keys(properties);
            const orderedProperties: { [propertyName: string]: Property } = {};
            
            // Rebuild the properties object with the new name in the same position of the old one
            for (const key of propertyKeys) {
              if (key === oldName) {
                orderedProperties[newName] = properties[oldName];
              } else {
                orderedProperties[key] = properties[key];
              }
            }
            
            // Replace the original properties object
            if (schema.properties) {
              schema.properties = orderedProperties;
            } else if (schema.items?.properties) {
              schema.items.properties = orderedProperties;
            }

            // Check if the expression is in the required ones:
            const required = schema.required || schema.items?.required || [];
            if(required.includes(oldName)) {
              //Delete the property from the required ones
              const index = required.indexOf(oldName);
              required[index] = newName;
            }
          } else {
            console.log('Property not found:', oldName);
            // Remove the expression from the policy string
            const updatedExpressions = expressions.filter(expr => expr !== expression);
            (node.expression as PolicyNodeValue).policy = updatedExpressions.join(';');
          }
        }
        else {
          console.error('Invalid rename expression:', expression);
        }
      }
      // Replace the original properties object
      if(node.output){
        node.output.value.value = schema;
      }
    }
  }

  const handleProjection = () => {
    // Split the policy string by semicolon to get individual expressions
    const expressions: string[] = (node.expression as PolicyNodeValue).policy.split(';');

    if(node.output?.tag === 'Response') {
      //Retrieve the schema making a deep copy of it:
      const schema = JSON.parse(JSON.stringify(node.input?.value.value)) as Schema;
      
      for (const expression of expressions) {
        const properties: { [propertyName: string]: Property } = schema.properties || schema.items?.properties || {};
        
        // Check if the oldName exists in the properties
        if (properties[expression]) {
          //Delete the property from the schema
          delete properties[expression];
        } else {
          console.log('Property not found:', expression);
          // Remove the expression from the policy string
          const updatedExpressions = expressions.filter(expr => expr !== expression);
          (node.expression as PolicyNodeValue).policy = updatedExpressions.join(';');
        }

        // Check if the expression is in the required ones:
        const required = schema.required || schema.items?.required || [];
        if(required.includes(expression)) {
          //Delete the property from the required ones
          const index = required.indexOf(expression);
          if (index > -1) {
            required.splice(index, 1);
          }
        }
      }
      // Replace the original properties object
      if(node.output){
        node.output.value.value = schema;
      }
    }
  }

  return (
    <>
      <InputValueComponent 
        title="Policy" 
        initialValue={node.expression?.policy || ''} 
        saveCallback={handleSave}
        secondValue={false}
      />
      {node.subType === PolicyNodeType.Encryption &&
        <InputValueComponent
          title="Encryption Algorithm"
          initialValue={node.expression?.encryptionAlgorithm || ''}
          placeholder="Enter the encryption algorithm"
          saveCallback={handleSave}
          secondValue={true}
        />
      }
  </>
  )
}


interface InputValueComponentProps {
  title: string;
  initialValue: string;
  placeholder?: string;
  saveCallback: (value: string, secondValue: boolean) => void;
  secondValue: boolean;
}

export const InputValueComponent = ({ title, initialValue, placeholder, saveCallback, secondValue}: InputValueComponentProps) => {
  const [value, setValue] = useState(initialValue);
  const [isDirty, setIsDirty] = useState(false);

  return(
    <>
      <Heading size="sm" mt={4} mb={2}> {title}:</Heading>
      <Group attached w="full" maxW="sm">
        <Input 
          flex="1"
          placeholder= {placeholder || "Enter your expression"}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsDirty(true);
          }}
        />
        <Button
          bg="bg.subtle"
          variant="outline"
          onClick={() => {
            saveCallback(value, secondValue);
            setIsDirty(false);
          }}
          disabled={!isDirty}>
          Save
        </Button>
      </Group>
    </>
  );
}