import { Parameter, PathItem, Property, Schema } from "./OpenAPI";

export type ItemValue = {
  name: string;
  value: PathItem | Property | Parameter | Schema;
}

export type FieldItem = {
  tag: "Field";
  name : string;
  label : string;
  type : string;
  index : number;
  responseIndex: number;
  required? : boolean;
  description? : string;
  canBeAdded : boolean;
  value: ItemValue;
  original: string; // Original name of the component
}

export type ParameterItem = {
  tag: "Parameter";
  name : string;
  label : string;
  type : string;
  index : number;
  responseIndex: number;
  required? : boolean;
  description? : string;
  canBeAdded : boolean;
  value: ItemValue;
  original: string; // Original name of the component
}

export type ResponseItem = {
  tag: "Response";
  name : string;
  label : string;
  properties : FieldItem[];
  index : number;
  resourceIndex : number;
  canBeAdded : boolean;
  value: ItemValue;
  original: string; // Original name of the component
}

export type ResourceItem = {
  tag: "Resource";
  name : string;
  label : string;
  outputResponse : ResponseItem;
  index : number;
  description? : string;
  parameters? : ParameterItem[];
  canBeAdded : boolean;
  value: ItemValue;
  original: string; // Original name of the component
}

export type DefaultItem = {
  tag: "Default";
  name : string;
  label : string;
  type : string;
  index : number;
  canBeAdded : boolean;
}