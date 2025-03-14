import { useState, useEffect } from "react";
import SwaggerClient from 'swagger-client';
import Yaml from 'js-yaml';

/*
  * Custom hook to parse OpenAPI files from JSON and YAML
  * @param {string} openAPIFile - the OpenAPI file to parse
  * @returns {object}:
  *   - the parsed OpenAPI object.spec  
  *   - isLoaded: boolean indicating if the file has been parsed
  *   - error: string indicating any errors that occurred during parsing
  * 
  * openAPI.spec:
  *   - info: { title, version, description }
  *   - openapi: version of openAPI
  *   - paths: { path: { method: { description, responses }}}
*/
const useParse = (openAPIFile) => {
    const [parsedFile, setParsedFile] = useState(null);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const parseFile = (file) => {
      if(typeof file != 'string'){
        console.log("typeof file: ", typeof file);
        try {
            file.text();
        } catch (error) {
            console.error('Error with OpenAPI file provided ', typeof file, ": ", error);
            throw error;
        }
      }

      if(file.trim().startsWith('{')){
        return JSON.parse(file);
      }
      else{
        return Yaml.load(file);
      }
    }
    
    useEffect(() => {
      if(!openAPIFile){
        setIsLoaded(false);
      }
      else{
        const parsed = parseFile(openAPIFile);

        SwaggerClient.resolve({ spec: parsed })
          .then((parsedAPI) => {
            if(parsedAPI.errors && parsedAPI.errors.length > 0){
              console.error('Error parsing OpenAPI file:', parsedAPI.errors);
              setError(parsedAPI.errors);
              setIsLoaded(false);
            }
            else{
              setParsedFile(parsedAPI.spec);
              setIsLoaded(true);
              setError(null);
              console.log('Parsed API:', parsedAPI);
            }
          })
          .catch((error) => {
            console.error('Error parsing OpenAPI file:', error);
            setError(error);
            setIsLoaded(false);
            throw error; //TODO: remove?
          });
      }

    }, [openAPIFile]);

    return {parsedFile, isLoaded, error};
}

export default useParse;