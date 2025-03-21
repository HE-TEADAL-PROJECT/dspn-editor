import { Flex, IconButton } from "@chakra-ui/react";
import { faFileImport, faFileUpload, faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { bottomButtonHoverColor, bottomButtonColor } from "../constants/default";
import { useState, useContext, useEffect } from "react";
import { GlobalContext } from "./GlobalContext";
import useParse from "./UseParse";
import { OpenAPI, Schema } from "../types/OpenAPI";
import { createNodeComponent, InputNodeType, nodeComponent, NodeType } from "../types/nodeTypes";

export default function PanelActions() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const {parsedFile: openAPI, isLoaded: isOpenAPILoaded} = useParse(fileContent);
  const { setOpenAPI } = useContext(GlobalContext);

  const { setResourceInputs, setResourceSchemaInputs, setResourceFieldInputs } = useContext(GlobalContext);
  
  function importModel() {
    console.log("Import Model");
  }

  function exportModel() {
    console.log("Export Model");
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
      }
    };
    input.click();
  }

  function analyzeOpenAPI(model: OpenAPI) {
    console.log("Analyzing OpenAPI...");

    try{
      const resourceInputs: nodeComponent[] = [];
      const resourceSchemaInputs: nodeComponent[] = [];
      const resourceFieldInputs: nodeComponent[] = [];

      const paths = Object.keys(model.paths) ?? [];

      for(let path = 0; path < paths.length; path++){
        const resource = paths[path];
        const resourceNode = createNodeComponent(
          {
            numberID: resourceInputs.length,
            label: resource,
            type: NodeType.Input,
            subType: InputNodeType.Resource,
            summary: model.paths[paths[path]].get.summary
          }
        );
        resourceInputs.push(resourceNode);
        
        const methods = Object.keys(model.paths[paths[path]]) ?? [];
        for(let method = 0; method < methods.length; method++){
          if(methods[method].toLowerCase() == 'get' &&
          model.paths[paths[path]][methods[method]].responses['200'].content &&
            model.paths[paths[path]][methods[method]].responses['200'].content!['application/json']?.schema?.$$ref
          ){ //Only GET methods and schema exists
            const ref = model.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema.$$ref;
            if (ref) {
              const schemaName = ref.split('/')[ref.split('/').length - 1];
              const label = resource + ":" + methods[method] + "." + schemaName;
              const summary = model.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema.type ?? 'Object';
              const schemaNode = createNodeComponent(
                {
                  numberID: resourceSchemaInputs.length,
                  label: label,
                  type: NodeType.Input,
                  subType: InputNodeType.Schema,
                  summary: summary,
                  canBeConnectedTo: [resourceNode.id]
                }
              );
              resourceSchemaInputs.push(schemaNode);

              if(model.components?.schemas){
                let schema: Schema = model.components?.schemas[schemaName];
                let prefix = '';
                if(schema.type == 'array'){
                  const itemsNode = createNodeComponent(
                    {
                      numberID: resourceFieldInputs.length,
                      label: label + ".items",
                      type: NodeType.Input,
                      subType: InputNodeType.Field,
                      summary: schema.items!.type,
                      canBeConnectedTo: [schemaNode.id]
                    }
                  );
                  resourceFieldInputs.push(itemsNode);
                  const subRef = schema.items!.$$ref;
                  const subSchemaName = subRef!.split('/')[subRef!.split('/').length - 1];
                  prefix = '.' + subSchemaName;
                  schema = model.components?.schemas[subSchemaName];
                }
                if(schema.properties){
                  const fields = Object.keys(schema.properties);
                  for(let field = 0; field < fields.length; field++){
                    const description = schema.properties[fields[field]].type ?? 'attribute';
                    const fieldNode = createNodeComponent(
                      {
                        numberID: resourceFieldInputs.length,
                        label: label + prefix + "." + fields[field],
                        type: NodeType.Input,
                        subType: InputNodeType.Field,
                        summary: description,
                        canBeConnectedTo: [schemaNode.id]
                      }
                    );
                    resourceFieldInputs.push(fieldNode);
                  } // End of fields loop
                }
              }
            }
          }
        } // End of methods loop
      } // End of paths loop
      setResourceInputs(resourceInputs);
      setResourceSchemaInputs(resourceSchemaInputs);
      setResourceFieldInputs(resourceFieldInputs);

      console.log("OpenAPI analyzed: ", resourceInputs, resourceSchemaInputs, resourceFieldInputs);
    }
    catch(err){
      console.error("Error analyzing OpenAPI: ", err);
    }
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
        title="Export Model"
        onClick={exportModel}
        bg="transparent"
        _hover={{ bg: bottomButtonHoverColor }}
      >
        <FontAwesomeIcon icon={faFileArrowDown} color={bottomButtonColor}/>
      </IconButton>
    </Flex>
  );
}