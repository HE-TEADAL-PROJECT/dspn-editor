/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
// @ts-expect-error No declaration file for archimate-js
import SwaggerClient from "swagger-client";
import Yaml from "js-yaml";

interface UseParseResult {
  parsedFile: any; // Replace `any` with a more specific type if available
  isLoaded: boolean;
  error: unknown;
}

/**
 * Custom hook to parse OpenAPI files from JSON and YAML.
 *
 * @param openAPIFile - The OpenAPI file (as a string) to parse.
 * @returns An object containing:
 *   - parsedFile: the parsed OpenAPI spec,
 *   - isLoaded: boolean indicating if the file has been parsed,
 *   - error: any error that occurred during parsing.
 */
const useParse = (openAPIFile: null | string): UseParseResult => {
  const [parsedFile, setParsedFile] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const parseFile = (file: string) => {
    // Although the JSDoc says file is a string,
    // we keep this check just in case.
    if (typeof file !== "string") {
      console.log("typeof file: ", typeof file);
      try {
        // If file isn't a string, assume it has a text() method.
        // (This branch should not be hit based on the current API.)
        (file as File).text();
      } catch (err) {
        console.error("Error with OpenAPI file provided ", typeof file, ": ", err);
        throw err;
      }
    }

    if (file.trim().startsWith("{")) {
      return JSON.parse(file);
    } else {
      return Yaml.load(file);
    }
  };

  useEffect(() => {
    if (!openAPIFile) {
      setIsLoaded(false);
    } else {
      try{
      const parsed = parseFile(openAPIFile);

      SwaggerClient.resolve({ spec: parsed })
        .then((parsedAPI: any) => {
          if (parsedAPI.errors && parsedAPI.errors.length > 0) {
            console.error("Error parsing OpenAPI file:", parsedAPI.errors);
            alert("Error parsing OpenAPI file:\n" + parsedAPI.errors);
            setError(parsedAPI.errors);
            setIsLoaded(false);
          } else {
            setParsedFile(parsedAPI.spec);
            setIsLoaded(true);
            setError(null);
            console.log("Parsed API:", parsedAPI);
          }
        })
        .catch((err: unknown) => {
          console.error("Error parsing OpenAPI file:", err);
          alert("Error parsing OpenAPI file:\n" + err);
          setError(err);
          setIsLoaded(false);
        });
      } catch (err) {
        console.error("Error parsing OpenAPI file:", err);
        alert("Error parsing OpenAPI file:\n" + err);
        setError(err);
        setIsLoaded(false);
      }
    }
  }, [openAPIFile]);

  return { parsedFile, isLoaded, error };
};

export default useParse;
