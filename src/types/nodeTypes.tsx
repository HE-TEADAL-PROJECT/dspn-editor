import { FieldItem, ParameterItem, ResourceItem, ResponseItem } from "./componentTypes";

export type NodeData = {
  label: string;
  type: NodeType;
  subType: InputNodeType | PolicyNodeType | OutputNodeType | DefaultNodeType;
  expression?: PolicyNodeValue;
  input?: ResourceItem | ResponseItem | ParameterItem | FieldItem; //[TODO] | DefaultItem;
  output?: ResourceItem | ResponseItem | ParameterItem | FieldItem; // PathItem | Schema | Parameter | Property. [TODO] DefaultItem
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
  Parameter = 'Parameter',
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

export type PolicyNodeValue = {
  policy: string;
  encryptionAlgorithm?: string;
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