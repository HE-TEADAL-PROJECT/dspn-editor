import { createContext } from 'react';
import { OpenAPI } from '../types/OpenAPI';
import { nodeComponent } from '../types/nodeTypes';

interface GlobalContextType  {
  openAPI: OpenAPI | undefined;
  setOpenAPI: (openAPI: OpenAPI | undefined) => void;
  showAPI: boolean;
  setShowAPI: (showAPI: boolean) => void;
  resourceInputs: nodeComponent[];
  setResourceInputs: React.Dispatch<React.SetStateAction<nodeComponent[]>>;
  resourceSchemaInputs: nodeComponent[];
  setResourceSchemaInputs: React.Dispatch<React.SetStateAction<nodeComponent[]>>;
  resourceFieldInputs: nodeComponent[];
  setResourceFieldInputs: React.Dispatch<React.SetStateAction<nodeComponent[]>>;
  isMenuOpen: boolean;
  setIsMenuOpen: (isMenuOpen: boolean) => void;
}

// Create a default value for the context
const defaultValue: GlobalContextType = {
  openAPI: undefined,
  setOpenAPI: () => {},
  showAPI: false,
  setShowAPI: () => {},
  resourceInputs: [],
  setResourceInputs: () => {},
  resourceSchemaInputs: [],
  setResourceSchemaInputs: () => {},
  resourceFieldInputs: [],
  setResourceFieldInputs: () => {},
  isMenuOpen: false,
  setIsMenuOpen: () => {},
};

export const GlobalContext = createContext<GlobalContextType>(defaultValue);