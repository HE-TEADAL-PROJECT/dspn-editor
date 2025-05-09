import { Flex, IconButton } from "@chakra-ui/react";
import { faFileImport, faFileUpload, faFileArrowDown, faFileExport } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { bottomButtonHoverColor, bottomButtonColor } from "../../constants/default";
import { useState, useContext, useEffect } from "react";
import { GlobalContext } from "../util/GlobalContext";
import useParse from "../util/UseParse";
import { OpenAPI, Parameter, PathItem, Schema,} from "../../types/OpenAPI";
import { FieldItem, ParameterItem, ResourceItem, ResponseItem } from "../../types/componentTypes";
import { Node, useReactFlow } from '@xyflow/react';
import { DEFAULT_COMPONENTS } from "../../constants/components";
import { NodeData, OutputNodeType } from "../../types/nodeTypes";


export default function PanelActions() {
  // Add useReactFlow hook to access nodes and edges
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  
  const [fileContent, setFileContent] = useState<string | null>(null);
  const {parsedFile: openAPI, isLoaded: isOpenAPILoaded} = useParse(fileContent);
  const { setOpenAPI } = useContext(GlobalContext);

  const { setResourceInputs, setResourceResponseInputs, setResourceParametersInputs, setResourceFieldInputs } = useContext(GlobalContext);
  const { resourceInputs, resourceResponseInputs, resourceParametersInputs, resourceFieldInputs } = useContext(GlobalContext);
  
  const { setPolicyNodesCount, setOutputNodesCount } = useContext(GlobalContext);
  const [fileTitle, setFileTitle] = useState<string>("model");
  
  // IMPORT STATE FUNCTION
  function importModel() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            try {
              const state = JSON.parse(e.target.result as string);
              
              // Restore nodes and edges
              setNodes(state.nodes || []);
              setEdges(state.edges || []);
              
              // Set counters that track IDs
              if (state.nodes && state.nodes.length > 0) {
                let policyCount = 0;
                let outputCount = 0;
                state.nodes.forEach((node: Node) => {
                  if (node.type === 'policyComponent') {
                    policyCount++;
                  } else if (node.type === 'outputComponent') {
                    outputCount++;
                  }
                });
                console.log("Policy nodes count: ", policyCount);
                console.log("Output nodes count: ", outputCount);
                setPolicyNodesCount(policyCount);
                setOutputNodesCount(outputCount);
              }

              //Set Default components usage
              if (state.nodes && state.nodes.length > 0) {
                state.nodes.forEach((node: Node) => {
                  if (node.type === 'defaultComponent') {
                    DEFAULT_COMPONENTS.forEach((component) => {
                      if(component.type === (node.data as NodeData).subType) {
                        component.available = false;
                      }
                    });
                  } 
                });
              }

              setResourceInputs(state.resourceInputs || []);
              setResourceResponseInputs(state.resourceResponseInputs || []);
              setResourceParametersInputs(state.resourceParametersInputs || []);
              setResourceFieldInputs(state.resourceFieldInputs || []);
              
              console.log("Model imported successfully");
            } catch (error) {
              console.error("Error importing model:", error);
            }
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
  
  // EXPORT STATE FUNCTION AND DOWNLOAD FILE
  function downloadModel() {
    // Get current nodes and edges
    const nodes = getNodes();
    const edges = getEdges();
    
    // Create a state object, including any objects needed to be saved
    const appState = {
      fileTitle,
      nodes,
      edges,
      resourceInputs,
      resourceResponseInputs,
      resourceParametersInputs,
      resourceFieldInputs,
    };
    
    // Convert to JSON
    const jsonString = JSON.stringify(appState, null, 2);
    
    // Create and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'visualizer-model.json';
    link.click();
    URL.revokeObjectURL(url);
    
    console.log("Model exported");
  }

  // EXPORT OPENAPI FUNCTION
  /* TODO: There still some issues with the $ref.
    Already tried to use SwaggerParser.bundle, from "@apidevtools/swagger-parser", but no results.
    Also tried to change $$ref in $ref.
    To use SwaggerParser.bundle, the package is needed to be installed in the project and at the beginning added:
      import { Buffer } from 'buffer';
      window.Buffer = Buffer; 
  */
  function exportOpenAPI() {
    // 1. Deep clone the OpenAPI object to avoid modifying the original
    const finalOpenAPI: OpenAPI = JSON.parse(JSON.stringify(openAPI));

    // 2. Clean up the OpenAPI object

    // 3. Search for output nodes and change the modified parts, in the order: Path, Parameter, Response, Field
    const nodes = getNodes();
    const outputNodes = nodes.filter((node) => node.type === 'outputComponent' && node.data?.output);
    const notVisitedNodes = outputNodes.filter((node) => node.data?.subType === OutputNodeType.Response);

    // Cycle through the Path output nodes 
    for (const node of outputNodes) {
      const resourceNode = node.data as NodeData;
      if(!resourceNode.output) continue; // Skip if no output

      // Output Path
      if(resourceNode.subType === OutputNodeType.Resource){
        // Delete the path entry with the original path name and replace it with the new one
        delete finalOpenAPI.paths[resourceNode.output.original];
        const pathName = resourceNode.output.value.name;
        finalOpenAPI.paths[pathName] = resourceNode.output.value.value as PathItem;

        // Cycle through the Response output nodes
        for (const node of outputNodes) {
          const responseNode = node.data as NodeData;
          if(!responseNode.output) continue; // Skip if no output

          if(responseNode.subType === OutputNodeType.Response){
            const oldPathName = responseNode.output.original.split(':')[0];

            // If it's part of this path, change the response
            if(oldPathName === pathName){
              // Remove from the notVisited nodes
              const index = notVisitedNodes.indexOf(node);
              if (index > -1) {
                notVisitedNodes.splice(index, 1);
              }

              // Change the schema in the response [TODO] create a new schema and change the ref?
              finalOpenAPI.paths[pathName]['get'].responses['200'].content!['application/json'].schema = responseNode.output.value.value as Schema;
            }

            // If OutputNodeType.Field are added, cycle through Field output nodes of this path here
          }
          // If OutputNodeType.Parameter are added, cycle through them here
        }
      }
    }

    // Cycle through the Response output nodes that were not visited because they are not part of a path present in the output nodes
    for (const node of notVisitedNodes) {
      const responseNode = node.data as NodeData;
      if(!responseNode.output) continue; // Skip if no output

      const pathName = responseNode.output.original.split(':')[0];

      if(finalOpenAPI.paths[pathName]?.['get']?.responses?.['200']?.content?.['application/json']?.schema){
        finalOpenAPI.paths[pathName]['get'].responses['200'].content!['application/json'].schema = responseNode.output.value.value as Schema;
      }
    }


    // Convert to JSON
    const jsonString = JSON.stringify(finalOpenAPI, null, 2);
    
    // Create and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileTitle + '.json';
    link.click();
    URL.revokeObjectURL(url);
    
    console.log("OpenAPI exported");
  }

  //Update the global context with the parsed OpenAPI data
  useEffect(() => {
    if(openAPI && isOpenAPILoaded){
      setOpenAPI(openAPI);
      analyzeOpenAPI(openAPI);
      console.log("OpenAPI loaded: ", typeof openAPI);
      //console.log(openAPI);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAPI, isOpenAPILoaded, setOpenAPI]); //Correct to not include analyzeOpenAPI in the dependency array

  function importOpenAPI () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept=".json,.yaml,.yml";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            let readText = e.target.result;
            if (readText instanceof ArrayBuffer) {
              const decoder = new TextDecoder("utf-8");
              readText = decoder.decode(readText);
            }
            setFileContent(readText as string);
          }
        };
        reader.readAsText(file);
        const name = (file.name.split(".json")[0]).split(".yaml")[0].split(".yml")[0];
        setFileTitle(name);
      }
    };
    input.click();
  }

// This function analyzes the OpenAPI object and retrieves the resources, responses, parameters and fields  
function analyzeOpenAPI (openAPI : OpenAPI) {
  const resources: ResourceItem[] = [];
  const responses: ResponseItem[] = [];
  const fields: FieldItem[] = [];
  const parameters: ParameterItem[] = [];

  if(!openAPI.paths){
    console.error("No paths found in OpenAPI object");
    return;
  }

  // Retrieve the response names that are produced by the GET methods
  const paths = Object.keys(openAPI.paths) ?? [];
  
  for (const path in paths) {
    const resource = paths[path];
    const methods = Object.keys(openAPI.paths[resource]) ?? [];
    
    const producedResponse = [];
    let requestedParameters: Parameter[] = [];
    const schemas: {[schemaName: string]: Schema} = {};

    for(const method in methods) {
      if(methods[method].toLowerCase() == 'get'){
        const ref = openAPI.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema.$$ref;
        if (ref) {
          const responseName = ref.split('/')[ref.split('/').length - 1];
          requestedParameters = openAPI.paths[paths[path]][methods[method]].parameters || [];
          producedResponse.push(responseName);
        }
        // If the response is not a reference, create a new schema
        else{
          console.log("No schema ref found for GET method in path: ", resource);
          const schema: Schema = openAPI.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema;
          const name = resource.split('/')[resource.split('/').length - 1];
          schemas[name] = schema;
          requestedParameters = openAPI.paths[paths[path]][methods[method]].parameters || [];
          producedResponse.push(name);
        }
      }
    }

    //Schemas are the union of all the schemas in the opnAPI and the ones created in the previous step
    for(const schemaName in openAPI.components!.schemas){
      schemas[schemaName] = openAPI.components!.schemas[schemaName];
    }

    //Retrieve responses and fields
    for (const responseName in schemas) {
      // Check if the response is produced by a GET method, if not, skip
      if(!producedResponse.includes(responseName)) continue;
      
      const response = schemas[responseName];
      const responseLabel = resource + ":get." + responseName;
      const responseItem: ResponseItem = {
        name: responseName,
        label: responseLabel,
        properties: [],
        resourceIndex: resources.length,
        index: responses.length,
        canBeAdded: true,
        tag: "Response",
        value: {name:responseName, value: response},
        original: responseLabel,
      };
  
      
      let properties = response.properties;
      let prefix = '';
      //If the response is an array, create a field for the items

      if(response.type == 'array'){
        properties = response.items!.properties;
        
        const subRef = response.items!.$$ref;
        const subResponseName = subRef!.split('/')[subRef!.split('/').length - 1];
        prefix = '.' + subResponseName;

      
        
        /*const fieldItems: FieldItem = {
          name: 'items',
          label: responseLabel + ".items",
          type: response.type,
          responseIndex: responses.length,
          index: fields.length,
          canBeAdded: true,
          tag: "Field",
          value: { name: 'items', value: response },
          original: responseLabel + ".items",
        };
        responseItem.properties.push(fieldItems);
        fields.push(fieldItems);*/
      }

      for (const propertyName in properties) {
        const property = properties[propertyName];
        const propertyLabel = responseLabel + prefix + "." + propertyName;
        const fieldItem: FieldItem = {
          name: propertyName,
          label: propertyLabel,
          type: property.type || 'object',
          responseIndex: responses.length,
          index: fields.length,
          required: response.required?.includes(propertyName),
          canBeAdded: true,
          tag: "Field",
          value: {name: propertyName, value: property},
          original: propertyLabel,
        };
        responseItem.properties.push(fieldItem);
        fields.push(fieldItem);
      }
      responses.push(responseItem);

    //Retrieve the parameters
    for (const parameter of requestedParameters) {
      const parameterName = parameter.name;
      const parameterLabel = resource + ":get." + parameterName;
      const parameterItem: ParameterItem = {
        name: parameterName,
        label: parameterLabel,
        type: parameter.schema.type || 'object',
        responseIndex: resources.length,
        index: parameters.length,
        required: parameter.required,
        canBeAdded: true,
        tag: "Parameter",
        value: {name: parameterName, value: parameter},
        original: parameterLabel,
      };
      parameters.push(parameterItem);
    }

    //Create the resource
    const resourceItem: ResourceItem = {
      name: resource,
      label: resource,
      outputResponse: responseItem,
      parameters: parameters,
      index: resources.length,
      canBeAdded: true,
      tag: "Resource",
      value: {name:resource, value: openAPI.paths[resource]},
      original: resource,
    };
    resources.push(resourceItem);
  }

  }

  setResourceInputs(resources);
  setResourceResponseInputs(responses);
  setResourceParametersInputs(parameters);
  setResourceFieldInputs(fields);

  console.log("Final resources: ", resources);
  console.log("Final responses: ", responses);
  console.log("Final parameters: ", parameters);
  console.log("Final fields: ", fields);
}

  return (
    <Flex mt={1} gap={1} flexWrap="wrap">
      <IconButton
        size="lg"
        title="Import OpenAPI"
        onClick={importOpenAPI}
        bg="transparent"
        _hover={{ bg: bottomButtonHoverColor }}
      >
        <FontAwesomeIcon icon={faFileImport} color={bottomButtonColor}/>
      </IconButton>

      <IconButton
        size="lg"
        title="Import Model"
        onClick={importModel}
        bg="transparent"
        _hover={{ bg: bottomButtonHoverColor }}
      >
        <FontAwesomeIcon icon={faFileUpload} color={bottomButtonColor}/>
      </IconButton>

      <IconButton
        size="lg"
        title="Download Model"
        onClick={downloadModel}
        bg="transparent"
        _hover={{ bg: bottomButtonHoverColor }}
      >
        <FontAwesomeIcon icon={faFileArrowDown} color={bottomButtonColor}/>
      </IconButton>

      <IconButton
        size="lg"
        title="Export OpenAPI"
        onClick={exportOpenAPI}
        bg="transparent"
        _hover={{ bg: bottomButtonHoverColor }}
      >
        <FontAwesomeIcon icon={faFileExport} color={bottomButtonColor}/>
      </IconButton>
    </Flex>
  );
}