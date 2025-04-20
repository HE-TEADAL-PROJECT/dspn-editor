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
  const [resourceParametersInputs, setResourceParametersInputs] = useState<FieldItem[]>([]);
  const [resourceFieldInputs, setResourceFieldInputs] = useState<FieldItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [policyNodesCount, setPolicyNodesCount] = useState<number>(0);
  const [outpuNodesCount, setOutputNodesCount] = useState<number>(0);

  return (
    <GlobalContext.Provider value={
      {
        openAPI, setOpenAPI,
        showAPI, setShowAPI,
        resourceInputs, setResourceInputs,
        resourceResponseInputs: resourceResponseInputs, setResourceResponseInputs: setResourceResponseInputs,
        resourceParametersInputs, setResourceParametersInputs,
        resourceFieldInputs, setResourceFieldInputs,
        isMenuOpen, setIsMenuOpen,
        policyNodesCount, setPolicyNodesCount,
        outpuNodesCount, setOutputNodesCount
      }}>
      {children}
    </GlobalContext.Provider>
  );
};