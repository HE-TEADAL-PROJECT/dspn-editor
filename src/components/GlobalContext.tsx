import { createContext } from 'react';
import { OpenAPI } from '../types/OpenAPI';
import { FieldItem, ResourceItem, ResponseItem } from '../types/componentTypes';

interface GlobalContextType  {
  openAPI: OpenAPI | undefined;
  setOpenAPI: (openAPI: OpenAPI | undefined) => void;
  showAPI: boolean;
  setShowAPI: (showAPI: boolean) => void;
  resourceInputs: ResourceItem[];
  setResourceInputs: React.Dispatch<React.SetStateAction<ResourceItem[]>>;
  resourceResponseInputs: ResponseItem[];
  setResourceResponseInputs: React.Dispatch<React.SetStateAction<ResponseItem[]>>;
  resourceParametersInputs: FieldItem[];
  setResourceParametersInputs: React.Dispatch<React.SetStateAction<FieldItem[]>>;
  resourceFieldInputs: FieldItem[];
  setResourceFieldInputs: React.Dispatch<React.SetStateAction<FieldItem[]>>;
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
  resourceParametersInputs: [],
  setResourceParametersInputs: () => {},
  resourceResponseInputs: [],
  setResourceResponseInputs: () => {},
  resourceFieldInputs: [],
  setResourceFieldInputs: () => {},
  isMenuOpen: false,
  setIsMenuOpen: () => {},
};

export const GlobalContext = createContext<GlobalContextType>(defaultValue);