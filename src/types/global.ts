import { OpenAPI } from "./OpenAPI";


declare global {
  // Add missing types for fullscreen API of older browsers
  interface Document {
    mozCancelFullScreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }

  // Add missing types for fullscreen API of older browsers
  interface HTMLElement {
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }

  // Extend the Window interface to include openApiModel
  interface Window {
      openApiModel?: OpenAPI; // OpenAPI model data
      resourceInputs?: Array<[string, string, boolean]>; // [resource:method, summary, available]
      resourceSchemaInputs?: Array<[string, string, boolean, string]>; // [schema, description, available, parent name]
      resourceFieldInputs?: Array<[string, string, boolean, string]>; // [resource.field, type, available, parent name]
    }
}
export {};