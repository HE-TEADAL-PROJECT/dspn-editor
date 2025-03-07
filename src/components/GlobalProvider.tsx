import { ReactNode, useState } from "react";
import { GlobalContext } from "./GlobalContext";
import { OpenAPI } from "../types/OpenAPI";


interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [openAPI, setOpenAPI] = useState<OpenAPI | undefined>(undefined);
  const [showAPI, setShowAPI] = useState<boolean>(false);

  return (
    <GlobalContext.Provider value={{ openAPI, setOpenAPI, showAPI, setShowAPI }}>
      {children}
    </GlobalContext.Provider>
  );
};