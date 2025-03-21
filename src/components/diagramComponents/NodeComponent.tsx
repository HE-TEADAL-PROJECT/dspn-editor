import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { InputNodeData, PolicyNodeData } from "../../types/nodeTypes";
import { Box } from "@chakra-ui/react";
import BaseComponent from "./BaseComponent";
import { inputColor, outputColor, policyColor } from "../../constants/nodesDefinitions";

type InputNode = Node<InputNodeData, "string">;

export function InputComponent({
  data: { label, node }, selected
}:NodeProps<InputNode>) {
  return <Box pos = {"relative"}>
		<BaseComponent label={label} color={inputColor} id = {node.id} selected = {selected} parentOf={node.parentOf}/>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
}

type PolicyNode = Node<PolicyNodeData, "string">;

export function PolicyComponent({
	data: { label }, selected
}:NodeProps<PolicyNode>) {
	return <Box pos = {"relative"}>
		<BaseComponent label={label} color={policyColor} selected = {selected}/>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
}

type OutputNode = Node<PolicyNodeData, "string">;

export function OutputComponent({
	data: { label }, selected
}:NodeProps<OutputNode>) {
	return <Box pos = {"relative"}>
		<BaseComponent label={label} color={outputColor} selected = {selected}/>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
}