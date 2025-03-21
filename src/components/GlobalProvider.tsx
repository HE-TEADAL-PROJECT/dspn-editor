import { ReactNode, useState } from "react";
import { GlobalContext } from "./GlobalContext";
import { OpenAPI } from "../types/OpenAPI";
import { nodeComponent } from "../types/nodeTypes";


interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [openAPI, setOpenAPI] = useState<OpenAPI | undefined>(undefined);
  const [showAPI, setShowAPI] = useState<boolean>(false);
  const [resourceInputs, setResourceInputs] = useState<nodeComponent[]>([]);
  const [resourceSchemaInputs, setResourceSchemaInputs] = useState<nodeComponent[]>([]);
  const [resourceFieldInputs, setResourceFieldInputs] = useState<nodeComponent[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <GlobalContext.Provider value={
      {
        openAPI, setOpenAPI,
        showAPI, setShowAPI,
        resourceInputs, setResourceInputs,
        resourceSchemaInputs, setResourceSchemaInputs,
        resourceFieldInputs, setResourceFieldInputs,
        isMenuOpen, setIsMenuOpen
      }}>
      {children}
    </GlobalContext.Provider>
  );
};