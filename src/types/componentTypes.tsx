export type FieldItem = {
  tag: "Field" | "Parameter";
  name : string;
  label : string;
  type : string;
  index : number;
  responseIndex: number;
  required? : boolean;
  description? : string;
  canBeAdded : boolean;
}

export type ResponseItem = {
  tag: "Response";
  name : string;
  label : string;
  properties : FieldItem[];
  index : number;
  resourceIndex : number;
  canBeAdded : boolean;
}

export type ResourceItem = {
  tag: "Resource";
  name : string;
  label : string;
  outputResponse : ResponseItem;
  index : number;
  description? : string;
  parameters? : FieldItem[];
  canBeAdded : boolean;
}