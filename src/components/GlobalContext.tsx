import { createContext } from 'react';
import { OpenAPI } from '../types/OpenAPI';

interface GlobalContextType  {
  openAPI: OpenAPI | undefined;
  setOpenAPI: (openAPI: OpenAPI | undefined) => void;
  showAPI: boolean;
  setShowAPI: (showAPI: boolean) => void;
}

// Create a default value for the context
const defaultValue: GlobalContextType = {
  openAPI: undefined,
  setOpenAPI: () => {},
  showAPI: false,
  setShowAPI: () => {},
};

export const GlobalContext = createContext<GlobalContextType>(defaultValue);