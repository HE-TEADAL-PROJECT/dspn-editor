import { createContext, useState } from 'react';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [openAPI, setOpenAPI] = useState(/*{
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Sample API",
      description: "A sample API to illustrate OpenAPI concepts"
    },
    paths: {
      "/list": {
        get: {
          description: "Returns a list of stuff",
          responses: {
            "200": {
              description: "Successful response"
            }
          }
        }
      },
      "/item": {
        get: {
          description: "Returns an item",
          responses: {
            "200": {
              description: "Successful response"
            }
          }
        }
      }
    }
  }*/ null);

  return (
    <GlobalContext.Provider value={{ openAPI, setOpenAPI }}>
      {children}
    </GlobalContext.Provider>
  );
};