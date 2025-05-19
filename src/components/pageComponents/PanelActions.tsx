import { Box, Flex, IconButton } from "@chakra-ui/react";
import { faFileImport, faFileUpload, faFileArrowDown, faFileExport } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { bottomButtonColor } from "../../constants/default";
import { useState, useContext, useEffect } from "react";
import { GlobalContext } from "../util/GlobalContext";
import useParse from "../util/UseParse";
import { OpenAPI, Parameter, PathItem, Schema, } from "../../types/OpenAPI";
import { FieldItem, ParameterItem, ResourceItem, ResponseItem } from "../../types/componentTypes";
import { Node, useReactFlow } from '@xyflow/react';
import { DEFAULT_COMPONENTS } from "../../constants/components";
import { NodeData, OutputNodeType } from "../../types/nodeTypes";

export default function PanelActions() {
  // Add useReactFlow hook to access nodes and edges
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();

  const [fileContent, setFileContent] = useState<string | null>(null);
  const { parsedFile: openAPI, isLoaded: isOpenAPILoaded } = useParse(fileContent);
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
                setPolicyNodesCount(policyCount);
                setOutputNodesCount(outputCount);
              }

              //Set Default components usage
              if (state.nodes && state.nodes.length > 0) {
                state.nodes.forEach((node: Node) => {
                  if (node.type === 'defaultComponent') {
                    DEFAULT_COMPONENTS.forEach((component) => {
                      if (component.type === (node.data as NodeData).subType) {
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
      //resourceFieldInputs,
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

function flattenRefs(obj: object): object {
  if (Array.isArray(obj)) {
    return obj.map(flattenRefs);
  }
  if (obj && typeof obj === 'object') {
    if ('$$ref' in obj) {
      // drop inline props, emit only real $ref
      return { $ref: ('#/').concat(obj.$$ref.replace(/#\/?/, '#/').split('#/')[1]) };
    }
    const out = {};
    for (const [key, val] of Object.entries(obj)) {
      out[key === '$$ref' ? '$ref' : key] = flattenRefs(val);
    }
    return out;
  }
  return obj;
}

  // EXPORT OPENAPI FUNCTION
  async function exportOpenAPI() {
    // 1. Crate a clean copy of the OpenAPI
    //let finalOpenAPI:OpenAPI = await SwaggerParser.bundle(openAPI) as OpenAPI;
    let finalOpenAPI: OpenAPI = JSON.parse(JSON.stringify(openAPI));
    finalOpenAPI = flattenRefs(finalOpenAPI) as OpenAPI;

    // 2. Search for output nodes and change the modified parts, in the order: Path, Parameter, Response, Field
    const nodes = getNodes();
    const outputNodes = nodes.filter((node) => node.type === 'outputComponent' && node.data?.output);

    
    // Cycle through the Path output nodes 
    for (const node of outputNodes) {
      const resourceNode = node.data as NodeData;
      if (!resourceNode.output) continue; // Skip if no output

      // Output Path
      if (resourceNode.subType === OutputNodeType.Resource) {
        // Delete the path entry with the original path name and replace it with the new one
        delete finalOpenAPI.paths[resourceNode.output.original];
        const pathName = resourceNode.output.value.name;
        finalOpenAPI.paths[pathName] = resourceNode.output.value.value as PathItem;
      }
    }


    // Cycle through the Response output nodes
    for (const node of outputNodes) {
      const responseNode = node.data as NodeData;
      if (!responseNode.output) continue; // Skip if no output

      const pathName = responseNode.output.original.split(':')[0];

      if (responseNode.subType === OutputNodeType.Response) {
        // Add the new schema to the components
        if (!finalOpenAPI.components) {
          finalOpenAPI.components = { schemas: {} };
        }
        // Check if there is already a schema with the same name in the original OpenAPI
        let name = responseNode.output.value.name;
        if (openAPI.components.schemas[responseNode.output.value.name]) {
          name = responseNode.output.value.name + "_" + pathName.split('/')[pathName.split('/').length - 1];
        }
        finalOpenAPI.components.schemas[name] = responseNode.output.value.value as Schema;

        // Change the schema ref in the response
        if (finalOpenAPI.paths[pathName]?.['get']?.responses?.['200']?.content?.['application/json']?.schema) {
          const schemaName = responseNode.output.value.name;
          const newSchema = {$ref: '#/components/schemas/' + schemaName};
          finalOpenAPI.paths[pathName]['get'].responses['200'].content!['application/json'].schema = newSchema as Schema;
        }
      }
    }


    // bundle the OpenAPI
    const bundled: OpenAPI = JSON.parse(JSON.stringify(finalOpenAPI));
    const clean = flattenRefs(bundled);
    const jsonString = JSON.stringify(clean, null, 2);

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
    if (openAPI && isOpenAPILoaded) {
      setOpenAPI(openAPI);
      analyzeOpenAPI(openAPI);
      console.log("OpenAPI loaded: ", typeof openAPI);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAPI, isOpenAPILoaded, setOpenAPI]); //Correct to not include analyzeOpenAPI in the dependency array

  function importOpenAPI() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.yaml,.yml";
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
  function analyzeOpenAPI(openAPI: OpenAPI) {
    const resources: ResourceItem[] = [];
    const responses: ResponseItem[] = [];
    const fields: FieldItem[] = [];
    const parameters: ParameterItem[] = [];

    if (!openAPI.paths) {
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
      const schemas: { [schemaName: string]: Schema } = {};

      for (const method in methods) {
        if (methods[method].toLowerCase() == 'get') {
          const ref = openAPI.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema.$$ref;
          if (ref) {
            const responseName = ref.split('/')[ref.split('/').length - 1];
            requestedParameters = openAPI.paths[paths[path]][methods[method]].parameters || [];
            producedResponse.push(responseName);
          }
          // If the response is not a reference, create a new schema
          else {
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
      for (const schemaName in openAPI.components!.schemas) {
        schemas[schemaName] = openAPI.components!.schemas[schemaName];
      }

      //Retrieve responses and fields
      for (const responseName in schemas) {
        // Check if the response is produced by a GET method, if not, skip
        if (!producedResponse.includes(responseName)) continue;

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
          value: { name: responseName, value: response },
          original: responseLabel,
        };


        let properties = response.properties;
        let prefix = '';
        //If the response is an array, create a field for the items

        if (response.type == 'array') {
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
            value: { name: propertyName, value: property },
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
            value: { name: parameterName, value: parameter },
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
          value: { name: resource, value: openAPI.paths[resource] },
          original: resource,
        };
        resources.push(resourceItem);
      }

    }

    setResourceInputs(resources);
    setResourceResponseInputs(responses);
    setResourceParametersInputs(parameters);
    setResourceFieldInputs(fields);

    /*
    console.log("Final resources: ", resources);
    console.log("Final responses: ", responses);
    console.log("Final parameters: ", parameters);
    console.log("Final fields: ", fields);
    */
  }

  const buttons = [
    {
      icon: faFileImport,
      title: "Import OpenAPI",
      onClick: importOpenAPI,
    },
    {
      icon: faFileUpload,
      title: "Import Model",
      onClick: importModel,
    },
    {
      icon: faFileArrowDown,
      title: "Download Model",
      onClick: downloadModel,
    },
    {
      icon: faFileExport,
      title: "Export OpenAPI",
      onClick: exportOpenAPI,
    },
  ];

  return (
    <Flex mt={1} gap={1} flexWrap="wrap" direction="row">
      {buttons.map((button) => (
        <Box
          background={"transparent"}
          borderRadius="5px"
          _hover={{ bg: "gray.100" }}
          key={button.title + ' button'}
        >
          <IconButton
            size="sm"
            aria-label={button.title}
            variant="outline"
            draggable={false}
            title={button.title}
            m={1}
            backgroundColor={"transparent"}
            onClick={button.onClick}
          >
            <FontAwesomeIcon icon={button.icon} style={{color: bottomButtonColor}} />
          </IconButton>
        </Box>//</div>
      ))}
    </Flex>
  );
}