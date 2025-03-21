export enum InputNodeType {
  Resource = 'resource',
  Schema = 'schema',
  Field = 'field',
}

export type InputNodeData = {
  label: string;
  type: InputNodeType;
  node: nodeComponent;
}

export enum PolicyNodeType {
  Policy = 'policy',
}

export type PolicyNodeData = {
  label: string;
  type: PolicyNodeType;
}

export enum OutputNodeType {
  Ouutput = 'output',
}

export type OutputNodeData = {
  label: string;
  type: OutputNodeType;
}

export enum NodeType {
  Input = 'input',
  Policy = 'policy',
  Output = 'output',
}


/**Represents the input component from the openAPI
 * @param id Unique ID for the component, same that should be used for the node
 * @param label Displayed label for the component
 * @param summary Summary of the component
 * @param type Type of the node component (NodeType)
 * @param canBeConnectedTo List of components' ID that can be connected to
 */
export interface nodeComponent {
  id: string;
  numberID: number;
  label: string;
  summary?: string;
  type: NodeType;
  subType: InputNodeType | PolicyNodeType | OutputNodeType;
  canBeConnectedTo: string[];
  canBeAdded: boolean;
  parentOf?: string[];
}

type NodeComponentCreationProps = Partial<nodeComponent> & {
  numberID: number;
  label: string;
  type: NodeType;
  subType: InputNodeType | PolicyNodeType | OutputNodeType;
};

/**
 * Helper function to create a nodeComponent object with default values.
 * Required fields: label, type, and subType.
 */
export function createNodeComponent({
  numberID, // Required
  label, // Required
  summary,
  type, // Required
  subType, // Required
  canBeConnectedTo: canConnectTo = [],
  canBeAdded = true,
}: NodeComponentCreationProps): nodeComponent {
  return {
    id: numberID.toString() + '.' + type.toString() + '.' + subType.toString(),
    numberID: numberID,
    label: label,
    summary: summary,
    type: type,
    subType: subType,
    canBeConnectedTo: canConnectTo,
    canBeAdded,
  };
}