import { ReactNode, useState } from "react";
import { GlobalContext } from "./GlobalContext";
import { OpenAPI } from "../types/OpenAPI";
import { FieldItem, ResourceItem, ResponseItem } from "../types/componentTypes";


interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [openAPI, setOpenAPI] = useState<OpenAPI | undefined>(undefined);
  const [showAPI, setShowAPI] = useState<boolean>(false);
  const [resourceInputs, setResourceInputs] = useState<ResourceItem[]>([]);
  const [resourceResponseInputs, setResourceResponseInputs] = useState<ResponseItem[]>([]);
  const [resourceFieldInputs, setResourceFieldInputs] = useState<FieldItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [resourceParametersInputs, setResourceParametersInputs] = useState<FieldItem[]>([]);

  return (
    <GlobalContext.Provider value={
      {
        openAPI, setOpenAPI,
        showAPI, setShowAPI,
        resourceInputs, setResourceInputs,
        resourceResponseInputs: resourceResponseInputs, setResourceResponseInputs: setResourceResponseInputs,
        resourceFieldInputs, setResourceFieldInputs,
        isMenuOpen, setIsMenuOpen,
        resourceParametersInputs, setResourceParametersInputs
      }}>
      {children}
    </GlobalContext.Provider>
  );
};