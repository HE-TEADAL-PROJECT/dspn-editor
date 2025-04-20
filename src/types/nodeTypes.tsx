import { DefaultItem, FieldItem, ResourceItem, ResponseItem } from "./componentTypes";

export type NodeData = {
  label: string;
  type: NodeType;
  subType: InputNodeType | PolicyNodeType | OutputNodeType | DefaultNodeType;
  value?: InputNodeValue | PolicyNodeValue | OutputNodeValue;
  input?: ResourceItem | ResponseItem | FieldItem | DefaultItem;
  output?: ResourceItem | ResponseItem | FieldItem | DefaultItem;
  parentOf: string[];
}

export enum InputNodeType {
  Resource = 'Resource',
  Response = 'Response',
  Parameter = 'Parameter',
  Field = 'Field',
}

export enum PolicyNodeType {
  Rename = 'Rename',
  Encryption = 'Encryption',
  Projection = 'Projection',
  Filter = 'Filter',
}

export enum OutputNodeType {
  Resource = 'Resource',
  Response = 'Response',
}

export enum DefaultNodeType {
  Request = 'Request',
  Platform = 'Platform',
  User = 'User',
}

export type PolicyNodeData = {
  label: string;
  type: PolicyNodeType;
}

export type InputNodeValue = {
  input: ResourceItem | ResponseItem | FieldItem;
}

export type PolicyNodeValue = {
  policy: string;
}

export type OutputNodeValue = {
  output: ResourceItem;
}

export enum NodeType {
  Input = 'input',
  Policy = 'policy',
  Output = 'output',
  Default = 'default',
}