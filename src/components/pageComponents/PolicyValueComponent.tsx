import { Group, Input, Button, Heading } from "@chakra-ui/react";
import { useState } from "react";
import { NodeData, PolicyNodeType, PolicyNodeValue } from "../../types/nodeTypes";
import { Property, Schema } from "../../types/OpenAPI";

export const PolicyValueComponent = ({ node,}: { node: NodeData }) => {

  let expressionTitle = "Expression";
  let placeholder = "Enter your expression";
  switch (node.subType as PolicyNodeType){
    case PolicyNodeType.Rename:
      expressionTitle = "Attributes to rename";
      break;
    case PolicyNodeType.Projection:
      expressionTitle = "Attributes to maintain";
      break;
    case PolicyNodeType.Encryption:
      expressionTitle = "Attributes to encrypt";
      break;
    case PolicyNodeType.Filter:
      expressionTitle = "Filter expression";
      break;
    case PolicyNodeType.Aggregation:
      expressionTitle = "Aggregation function";
      placeholder = "AVG, SUM, MIN, MAX, COUNT";
      break;
    case PolicyNodeType.Anonymization:
      expressionTitle = "Anonymization expression";
      break;
    default:
      console.error("Unknown policy node type:", node.subType);
      return null;
  }

  const handleSave = (expr:string, valueNumber:number = 0) => {
    if(valueNumber > 0){
      if(node.subType === PolicyNodeType.Encryption){
        // Save the encryption algorithm in the node expression
        if (!node.policy) {
          node.policy = { expression:'', encryptionAlgorithm: expr };
        } else {
          (node.policy as PolicyNodeValue).encryptionAlgorithm = expr;
        }
      }
      else if(node.subType === PolicyNodeType.Aggregation){
        expr = expr.trim();
        // Save the aggregated attribute in the node expression
        if (valueNumber === 1) {
          if (!node.policy) {
            node.policy = { expression:'', aggregatedAttribute: expr };
          } else {
            (node.policy as PolicyNodeValue).aggregatedAttribute = expr;
          }
        }
        // Save the aggregating attributes in the node expression
        else if (valueNumber === 2) {
          const aggregatingAttributes = expr.split(';').map(attr => attr.trim());
          if (!node.policy) {
            node.policy = { expression:'', aggregatingAttributes: aggregatingAttributes };
          } else {
            (node.policy as PolicyNodeValue).aggregatingAttributes = aggregatingAttributes;
          }
        }
      }
    }
    else{
       // If not second value: save the value in the node expression
      if (!node.policy) {
        node.policy = { expression: expr };
      } else {
        (node.policy as PolicyNodeValue).expression = expr;
      }
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
        case PolicyNodeType.Aggregation:
          handleAggregation();
          break;
        case PolicyNodeType.Filter:
          handleFilter();
          break;
        case PolicyNodeType.Encryption:
          handleEncryption();
          break;
        default:
          return;
      }

      //[TODO]: Update the input value of the possible connected nodes. Now the user needs to reconnect the nodes to see the changes.
    }
  };
  
  const handleRename = () => {
    // Split the policy string by semicolon to get individual expressions
    const expressions: string[] = (node.policy as PolicyNodeValue).expression.split(';');

    if(node.output?.tag === 'Resource'){
      for (const expression of expressions) {
        const [oldName, newName] = expression.split(':').map(s => s.trim());
        
        if (!oldName || !newName){ // If it's a single name it's a rename of the value:
          node.output!.value.name = expression;
          (node.policy as PolicyNodeValue).expression = expression; // Keep the last valid expression in the policy as the expression
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
            (node.policy as PolicyNodeValue).expression = updatedExpressions.join(';');
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

  // Handle projection policy, only for Response nodes
  const handleProjection = () => {
    // Split the policy string by semicolon to get individual expressions, removing whitespaces
    const expressions: string[] = ((node.policy as PolicyNodeValue).expression.split(';')).map(expr => expr.trim());

    if(node.output?.tag === 'Response') {
      //Retrieve the schema making a deep copy of it:
      const schema = JSON.parse(JSON.stringify(node.input?.value.value)) as Schema;
      const properties: { [propertyName: string]: Property } = schema.properties || schema.items?.properties || {};
      const required = schema.required || schema.items?.required || [];
      
      // Cycle through the properties and remove the ones that are not in the expressions
      for (const property in properties) {
        if (!expressions.includes(property)) {
          delete properties[property];

          if(required.includes(property)) {
            //Delete the property from the required ones
            const index = required.indexOf(property);
            if (index > -1) {
              required.splice(index, 1);
            }
          }
        }
      }

      // Replace the original properties object
      if(node.output){
        node.output.value.value = schema;
      }
    }
  }

  // Handle aggregatio policy
  const handleAggregation = () => {
    if(node.policy?.expression && node.policy.aggregatedAttribute) {
      if(node.output?.tag === 'Response'){
        //Retrieve the schema making a deep copy of it:
        const schema = JSON.parse(JSON.stringify(node.input?.value.value)) as Schema;

        const properties: { [propertyName: string]: Property } = schema.properties || schema.items?.properties || {};
        
        if(properties[node.policy.aggregatedAttribute]) {
          const property: Property = properties[node.policy.aggregatedAttribute];
          const name: string = node.policy.expression.toLowerCase() + '_' + node.policy.aggregatedAttribute.toLowerCase();

          const newSchema: Schema = {
            type: 'object',
            properties: { [name]: property },
          };

          // Replace the original properties object
          if(node.output){
            node.output.value.value = newSchema;
          }
        }
        else{
          console.error('Property not found:', node.policy.aggregatedAttribute);
          node.policy.aggregatedAttribute = '';
        }
      }
      else{
        console.error('Output is not defined for aggregation policy or not a Response node');
      }
    }
    else if (node.output){
      node.output.value.value = {
        type: 'object',
        properties: { },
      };
    }
  }

  // Handle filter policy
  const handleFilter = () => {
    // TODO: Implement filter policy handling
  }

  // Handle encryption policy
  const handleEncryption = () => {
    // Split the policy string by semicolon to get individual expressions, removing whitespaces
    const expressions: string[] = ((node.policy as PolicyNodeValue).expression.split(';')).map(expr => expr.trim());
    
    //Retrieve the schema making a deep copy of it:
    const schema = JSON.parse(JSON.stringify(node.input?.value.value)) as Schema;
    const properties: { [propertyName: string]: Property } = schema.properties || schema.items?.properties || {};

    let newExpressions = expressions.map(expr => expr.trim());

    for (const expression of expressions) {
      if (!properties[expression]) {
        console.error('Property not found:', expression);
        // Remove the expression from the policy string
        newExpressions = newExpressions.filter(expr => expr !== expression);
      }
    }

    // Update the policy expression with the new expressions
    (node.policy as PolicyNodeValue).expression = newExpressions.join(';');
  }

  return (
    <>
      <InputValueComponent 
        title={expressionTitle}
        initialValue={node.policy?.expression || ''} 
        saveCallback={handleSave}
        placeholder={placeholder}
        valueNumber={0}
      />
      {node.subType === PolicyNodeType.Encryption &&
        <InputValueComponent
          title="Encryption Algorithm"
          initialValue={node.policy?.encryptionAlgorithm || ''}
          placeholder="Enter the encryption algorithm"
          saveCallback={handleSave}
          valueNumber={1}
        />
      }
      {node.subType === PolicyNodeType.Aggregation &&
        <>
          <InputValueComponent
            title="Aggregated attribute"
            initialValue={(node.policy as PolicyNodeValue).aggregatedAttribute || ''}
            placeholder="Enter the aggregated attribute"
            saveCallback={handleSave}
            valueNumber={1}
          />
          <InputValueComponent
            title="Aggregating attributes"
            initialValue={(node.policy as PolicyNodeValue).aggregatingAttributes?.join(';') || ''}
            placeholder="Enter the aggregating attributes separated by semicolon"
            saveCallback={handleSave}
            valueNumber={2}
          />
        </>
      }
  </>
  )
}


interface InputValueComponentProps {
  title: string;
  initialValue: string;
  placeholder?: string;
  saveCallback: (value: string, valueNumber: number) => void;
  valueNumber: number;
}

export const InputValueComponent = ({ title, initialValue, placeholder, saveCallback, valueNumber}: InputValueComponentProps) => {
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
          width={"300px"}
        />
        <Button
          bg="bg.subtle"
          variant="outline"
          onClick={() => {
            saveCallback(value, valueNumber);
            setIsDirty(false);
          }}
          disabled={!isDirty}>
          Save
        </Button>
      </Group>
    </>
  );
}