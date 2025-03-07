import React, { useContext, useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "archimate-js/assets/archimate-js.css";
// @ts-expect-error No declaration file for archimate-js
import Modeler from "archimate-js/lib/Modeler.js";
import useParse from "./UseParse.tsx";
import { GlobalContext } from './GlobalContext.tsx';
import {OpenAPI, Schema} from "../types/OpenAPI.ts";


const ArchimateJS: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [modeler, setModeler] = useState<Modeler | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const [fileContent, setFileContent] = useState<string | null>(null);
  const {parsedFile: openAPI, isLoaded: isOpenAPILoaded} = useParse(fileContent);
  const { setOpenAPI } = useContext(GlobalContext);
  const { showAPI, setShowAPI } = useContext(GlobalContext);


  //Update the global context with the parsed OpenAPI data
  useEffect(() => {
    if(openAPI && isOpenAPILoaded){
      setOpenAPI(openAPI);
      setShowAPI(true);
      updateWindowParams(openAPI);
      updateWindowParameters(openAPI);
      console.log("OpenAPI loaded: ", typeof openAPI);
      //console.log(openAPI);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAPI, isOpenAPILoaded, setOpenAPI]); //Correct to not include showAPI in the dependency array

  useEffect(() => {
    if (canvasRef.current) {
      const newModeler = new Modeler({
        container: canvasRef.current,
        keyboard: { bindTo: window },
      });
      setModeler(newModeler);
      newModeler.createNewModel().catch((err: unknown) =>
        console.error("could not create new archimate model", err)
      );
    }

    // Initialize Bootstrap tooltips
    document.querySelectorAll('[data-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });

    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((el) => {
      new bootstrap.Dropdown(el);
    });
  }, []);

  const toggleFullscreen = () => {
    if (!fullScreen) {
      document.documentElement.requestFullscreen?.();
      document.documentElement.mozRequestFullScreen?.();
      document.documentElement.webkitRequestFullscreen?.();
      document.documentElement.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.();
      document.mozCancelFullScreen?.();
      document.webkitExitFullscreen?.();
      document.msExitFullscreen?.();
    }
    setFullScreen(!fullScreen);
  };

  const getSVGfromModel = async () => {
    if (modeler) {
      const result = await modeler.saveSVG();
      download("model.svg", result.svg);
    }
  };

  const getXMLfromModel = async () => {
    if (modeler) {
      const result = await modeler.saveXML({ format: true });
      download("model.xml", result.xml);
    }
  };

  const importModel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) openFile(file);
    };
    input.click();
  };

  function newModel() {
    modeler.createNewModel().catch(function(err: Error) {
      if (err) {
        return console.error('could not create new archimate model', err);
      }
    });
  }

  const openFile = (file: File) => {
    if (!window.FileReader) {
      alert("Use a modern browser such as Chrome or Firefox.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      modeler?.importXML(xml).then(( warnings: Array<string>) => {
        if (warnings.length) {
          console.warn(warnings);
          alert("Warning(s) on importing archimate model.");
        }
        modeler.openView().catch((err: Error) => console.error("could not open view", err));
      }).catch((err: Error) => console.error("could not import model: ", err.message));
    };
    reader.readAsText(file);
  };

  const download = (filename: string, data: string) => {
    const element = document.createElement("a");
    element.href = "data:application/xml;charset=UTF-8," + encodeURIComponent(data);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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

  function showOpenAPI () {
    setShowAPI(!showAPI);
  }

  return (
    <>
      <nav className="navbar fixed-bottom navbar-expand bg-light">
        <div className="container-fluid">
          <ul className="navbar-nav">
            <li className="nav-item">
              <button className="nav-link btn" onClick={importOpenAPI} title="Import OpenAPI" id="js-new-openAPI">
                <i className="fa-solid fa-file-import fa-lg"></i>
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn" onClick={newModel} title="New model" id="js-new-model">
                <i className="fas fa-file-medical fa-lg"></i>
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn" onClick={importModel} title="Import Model" id="js-import-model">
                <i className="fas fa-file-upload fa-lg"></i>
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn" onClick={getXMLfromModel} title="Export XML" id="js-export-model-xml">
                <i className="fas fa-file-code fa-lg"></i>
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn" onClick={getSVGfromModel} title="Export SVG" id="js-export-model-svg">
                <i className="fas fa-file-image fa-lg"></i>
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link btn" onClick={toggleFullscreen} title="Fullscreen">
                <i className="fa-solid fa-maximize fa-lg"></i>
              </button>
            </li>
            {openAPI &&
              <li className="nav-item">
                <button className="nav-link btn" onClick={showOpenAPI} title="Fullscreen">
                  <i className = {(showAPI)? "fa-solid fa-eye-slash fa-lg": "fa-solid fa-eye fa-lg"}></i>
                </button>
              </li>
            }
          </ul>
          <span className="h5 text-right">DSPN modeler demo</span>
        </div>
      </nav>
      <div id="canvas" ref={canvasRef} style={{ height: "100vh", width: "100vw", overflow: "hidden" }} />
    </>
  );
};

// Update the global window object with the OpenAPI model data
function updateWindowParams(model: OpenAPI){
  try{
    console.log("Updating window object with OpenAPI model data");
    window.openApiModel = model;

    const resourceInputs: Array<[string, string, boolean]> = [];
    const resourceSchemaInputs: Array<[string, string, boolean, string]> = [];
    const resourceFieldInputs: Array<[string, string, boolean, string]> = [];

    const resources = Object.keys(model.paths)? Object.keys(model.paths): [];
    const schemas = model.components?.schemas? Object.keys(model.components.schemas): [];

    // Resource inputs
    for (let resource = 0; resource < resources.length; resource++) {
      const methods = Object.keys(model.paths[resources[resource]])? Object.keys(model.paths[resources[resource]]): [];
      for (let method = 0; method < methods.length; method++) {
        const input: [string, string, boolean] = [resources[resource] + ':' + methods[method], model.paths[resources[resource]][methods[method]].summary, true];
        resourceInputs.push(input);
      }
    }
    
    // Resource schema inputs
    for (let schema = 0; schema < schemas.length; schema++) {
      const input: [string, string, boolean, string] = [schemas[schema], '', true, '']; //TODO
      resourceSchemaInputs.push(input);
    }
    
    // Resource field inputs
    for (let schema = 0; schema < schemas.length; schema++) {
      const schemaType = model.components!.schemas[schemas[schema]]?.type ?? null;
      if (schemaType == 'array') { // Array type
        resourceFieldInputs.push([schemas[schema] + '.items', 'array', true, '']); //TODO
      }
      else{ // Object type with Fields
        const fields = Object.keys(model.components!.schemas[schemas[schema]].properties!);
        for (let field = 0; field < fields.length; field++) {
          const name = schemas[schema] + '.' + fields[field];
          const input: [string, string, boolean, string] = [name, model.components!.schemas[schemas[schema]].properties![fields[field]].type!, true, '']; //TODO
          resourceFieldInputs.push(input);
        }
      }
    }
    
    window.resourceInputs = resourceInputs;
    window.resourceSchemaInputs = resourceSchemaInputs;
    window.resourceFieldInputs = resourceFieldInputs;
    
    console.log("Window object updated with OpenAPI model data");
    console.log(window.openApiModel);
    console.log(window.resourceInputs);
    console.log(window.resourceSchemaInputs);
    console.log(window.resourceFieldInputs);
  }
  catch(err){
    console.error("Error updating window object with OpenAPI model data: ", err);
    alert("Error with the definition of the OpenAPI model");
  }
}

function updateWindowParameters(model: OpenAPI){
  try{
    window.openApiModel = model;

    const resourceInputs: Array<[string, string, boolean]> = [];
    const resourceSchemaInputs: Array<[string, string, boolean, string]> = [];
    const resourceFieldInputs: Array<[string, string, boolean, string]> = [];

    //Schemas:




    const paths = Object.keys(model.paths)? Object.keys(model.paths): [];
    
    //model.paths[paths[path]][methods[method]].responses['200']!.content['application/json']!.schema
    for(let path = 0; path < paths.length; path++){
      const resourceName = paths[path];
      resourceInputs.push([resourceName, model.paths[paths[path]].get.summary, true]);
      const methods = Object.keys(model.paths[paths[path]])? Object.keys(model.paths[paths[path]]): [];
      for(let method = 0; method < methods.length; method++){
        if(methods[method].toLowerCase() == 'get'){ //Only GET methods
          if(model.paths[paths[path]][methods[method]].responses['200'].content &&
            model.paths[paths[path]][methods[method]].responses['200'].content!['application/json'] &&
            model.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema &&
            model.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema.$$ref
          ){ // if schema exists:
            const ref = model.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema.$$ref;
            if (ref){
              const schemaName = ref.split('/')[ref.split('/').length - 1];
              const result = paths[path] + ':' + methods[method] + "." + schemaName;
              const description = model.paths[paths[path]][methods[method]].responses['200'].content!['application/json'].schema.type ?? 'Object';
              resourceSchemaInputs.push([result, description, true, resourceName]);

              //CAMPI FIELDS
              if(model.components?.schemas){
                let schema: Schema = model.components?.schemas[schemaName];
                let prefix = '';
                if(schema.type && schema.type == 'array'){
                  resourceFieldInputs.push([result + '.items', 'array', true, result]);
                  const subRef = schema.items!.$$ref;
                  const subSchemaName = subRef!.split('/')[subRef!.split('/').length - 1];
                  prefix = '.' + subSchemaName;
                  schema = model.components?.schemas[subSchemaName];
                }
                if(schema.properties){
                  const fields = Object.keys(schema.properties);
                  for(let field = 0; field < fields.length; field++){
                    const description = schema.properties[fields[field]].type ?? 'attribute';
                    resourceFieldInputs.push([result + prefix + '.' + fields[field], description, true, result]);
                  }
                }
              }
            }
          }
        }
      }
    }


    window.resourceInputs = resourceInputs;
    window.resourceSchemaInputs = resourceSchemaInputs;
    window.resourceFieldInputs = resourceFieldInputs;
    
    console.log("Window object updated with OpenAPI model data");
    console.log(window.openApiModel);
    console.log(window.resourceInputs);
    console.log(window.resourceSchemaInputs);
    console.log(window.resourceFieldInputs);
  }
  catch(err){
    console.error("Error updating window object with OpenAPI model data: ", err);
    alert("Error with the definition of the OpenAPI model");
  }
}

export default ArchimateJS;