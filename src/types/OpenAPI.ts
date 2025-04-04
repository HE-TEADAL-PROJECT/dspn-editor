export interface OpenAPI {
  openapi: string;
  info?: Info;
  paths: Paths;
  components?: Components;
  servers?: Server[];
}

export interface Info {
  title: string;
  description?: string;
  version: string;
}

export interface Paths {
  [path: string]: PathItem;
}

export interface PathItem {
  [method: string]: Operation;
}

export interface Operation {
  operationId: string;
  parameters?: Parameter[];
  summary: string;
  description?: string;
  responses: Responses;
}

export interface Parameter {
  name: string;
  in: string;
  required: boolean;
  description?: string;
  schema: Schema;
}

export interface Responses {
  [statusCode: string]: Response;
}

export interface Response {
  description: string;
  content?: Content;
}

export interface Content {
  [mediaType: string]: MediaType;
}

export interface MediaType {
  schema: Schema;
}

export interface Schema {
  $$ref?: string;
  type?: string;
  items?: Schema;
  properties?: {
    [propertyName: string]: Property;
  };
  required?: string[];
}

export interface Property {
  type: string;
  example?: string;
}

export interface Components {
  schemas: {
    [schemaName: string]: Schema;
  };
}

export interface Server {
  url: string;
}