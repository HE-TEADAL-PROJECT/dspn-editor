import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { NodeData } from "../../types/nodeTypes";
import { Box } from "@chakra-ui/react";
import BaseComponent from "./BaseComponent";
import { defaultColor, inputColor, outputColor, policyColor } from "../../constants/nodesDefinitions";

type InputNode = Node<NodeData, "string">;

export function InputComponent({
  id, data: { label, parentOf }, selected
}:NodeProps<InputNode>) {
  return <Box pos = {"relative"}>
		<BaseComponent label={label} color={inputColor} id = {id} selected = {selected} parentOf={parentOf}/>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
}

type PolicyNode = Node<NodeData, "string">;

export function PolicyComponent({
	id, data: { label }, selected
}:NodeProps<PolicyNode>) {
	return <Box pos = {"relative"}>
		<BaseComponent label={label} color={policyColor} id = {id} selected = {selected}/>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
}

type OutputNode = Node<NodeData, "string">;

export function OutputComponent({
	id, data: { label }, selected
}:NodeProps<OutputNode>) {
	return <Box pos = {"relative"}>
		<BaseComponent label={label} color={outputColor} id = {id} selected = {selected}/>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
}

type DefaultNode = Node<NodeData, "string">;

export function DefaultComponent({
	id, data: { label }, selected
}:NodeProps<DefaultNode>) {
	return <Box pos = {"relative"}>
		<BaseComponent label={label} color={defaultColor} id = {id} selected = {selected}/>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
}