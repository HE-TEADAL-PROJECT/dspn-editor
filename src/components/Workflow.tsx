import { Box } from '@chakra-ui/react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  BackgroundVariant,
  Connection,
  Edge,
  useReactFlow,
  XYPosition,
  Node,
  OnReconnect,
  OnNodeDrag,
  useKeyPress,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useContext, useRef, useState } from 'react';
import { InputComponent, OutputComponent, PolicyComponent, DefaultComponent } from './diagramComponents/NodeComponent';
import { InputNodeType, NodeData, NodeType, PolicyNodeType } from '../types/nodeTypes';
import RelationConnection from './diagramComponents/RelationConnection';
import { baseMarkerEnd, } from '../constants/nodesDefinitions';
import ConnectionLine from './diagramComponents/ConnectionLine';
import { GlobalContext } from './util/GlobalContext';
import { FieldItem, ParameterItem, ResourceItem, ResponseItem } from '../types/componentTypes';
import LeftPanel from './pageComponents/LeftPanel';
import { DEFAULT_COMPONENTS } from '../constants/components';
import RightPanel from './pageComponents/RightPanel';

const nodeTypes = {
  inputComponent: InputComponent,
  policyComponent: PolicyComponent,
  outputComponent: OutputComponent,
  defaultComponent: DefaultComponent,
}

const edgeTypes = {
  relationConnection: RelationConnection,
}

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];


const Workflow = () => {
  const [nodes, setNodes, onNodesChannge] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { setResourceInputs, setResourceResponseInputs, setResourceFieldInputs, setResourceParametersInputs } = useContext(GlobalContext);
  const { setIsMenuOpen } = useContext(GlobalContext);
  
  const {screenToFlowPosition, getIntersectingNodes } = useReactFlow();


  // ADD AND REMOVE EDGES

  const addEdge = useCallback((connection: Connection) => {
    const connectionName = `${connection.source}-${connection.target}`;
    if(edges.find((edge) => edge.id === connectionName)) return; // Already connected

    const targetNode = nodes.find((node) => node.id === connection.target);
    const sourceNode = nodes.find((node) => node.id === connection.source);
    if(!targetNode || !sourceNode) return; // No nodes found

    const sourceNodeData = sourceNode.data as NodeData;
    const targetNodeData = targetNode.data as NodeData;
    if(!sourceNodeData || !targetNodeData) return; // No data found

    let markerStart, markerEnd;
    markerStart = '';
    markerEnd = baseMarkerEnd;

    // InputNode - InputNode: Realization
    if(sourceNodeData.type === NodeType.Input && targetNodeData.type === NodeType.Input) {
      markerStart = 'diamond';
    }

    //Realization
    if(sourceNodeData.type === NodeType.Input && targetNodeData.type === NodeType.Output) {
      markerEnd = 'empty-arrow';
      //TODO: change connection line
    }

    const edge: Edge = {
      ...connection,
      type: 'relationConnection',
      id: connectionName,
      markerStart: markerStart,
      markerEnd: markerEnd,
    };
    setEdges((eds) => eds.concat(edge));

    switch(targetNode?.type) {
      case 'policyComponent':
        onConnectedPolicy(sourceNodeData, targetNodeData);
        break;
      case 'outputComponent':
        onConnectedOutput(sourceNodeData, targetNodeData);
        break;
    }
    
  }, [edges, setEdges, nodes]);

  const removeEdge = (edge: Edge) => {
    setEdges((prevEdges) => prevEdges.filter((e) => e.id !== edge.id));
    const targetNode = nodes.find((node) => node.id === edge.target);
    switch(targetNode?.type) {
      case 'policyComponent':
        onDisconnectedPolicy(targetNode);
        break;
      case 'outputComponent':
        onDisconnectedOutput(targetNode);
        break;
    }
  }

  const onConnect = useCallback((connection: Connection) => {
    addEdge(connection);
  }, [addEdge]);

  const edgeReconnectSuccessful = useRef(false);

  const onReconnectStart = () => {
    edgeReconnectSuccessful.current = false;
  }

  const onReconnect:OnReconnect = (oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true;
    if(oldEdge === newConnection) return; // No change in the connection
    removeEdge(oldEdge);
    addEdge(newConnection);
    
  }

  const onReconnectEnd = (_:MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      removeEdge(edge);
    }
  }

  const onConnectedPolicy = (sourceNode: NodeData, targetNode: NodeData) => {
    if(sourceNode.output !== undefined) {
      //Update input and output:
      targetNode.input = JSON.parse(JSON.stringify(sourceNode.output));
      targetNode.output = JSON.parse(JSON.stringify(sourceNode.output));
    }
  }

  const onConnectedOutput = (sourceNode: NodeData, targetNode: NodeData) => {
    // If still default name, change it to target's
    if(targetNode.label === targetNode.subType && sourceNode.output?.value?.name) {
      targetNode.label = sourceNode.output.value.name;
    }

    if(sourceNode.output !== undefined) {
      //Update input and output:
      targetNode.input = JSON.parse(JSON.stringify(sourceNode.output));
      targetNode.output = JSON.parse(JSON.stringify(sourceNode.output));
    }
  }

  const onDisconnectedPolicy = (node: Node) => {
    // Reset Policy
    (node.data as NodeData).input = undefined;
    (node.data as NodeData).output = undefined;
  }

  const onDisconnectedOutput = (node: Node) => {
    // Change to default name:
    node.data.label = node.data.subType as string;

    // Reset input and output:
    (node.data as NodeData).output = undefined;
    (node.data as NodeData).input = undefined;
  }


  // CHECK CONNECTIONS

  const isValidConnection = (connection: Edge | Connection) => {
    const {source, target} = connection;
    // Not allow connection to the same node
    if (source === target) {
      return false;
    }
    
    const sourceNode = nodes.find((node) => node.id === source)?.data as NodeData;
    const targetNode = nodes.find((node) => node.id === target)?.data as NodeData;

    if(!sourceNode || !targetNode) return false;

    // No connections from OutputNode
    if(sourceNode.type === NodeType.Output) return false;


    if(targetNode.type === NodeType.Input) {
      return isInputConnectionValid(sourceNode, targetNode);
    }
    else if(targetNode.type === NodeType.Policy) {
      return isPolicyConnectionValid(sourceNode, targetNode);
    }
    else if(targetNode.type === NodeType.Output) {
      return isOutputConnectionValid(sourceNode, targetNode);
    }

    return false
  }

  // target is InputNode: only from other InputNodes
  const isInputConnectionValid = (sourceNode: NodeData, targetNode: NodeData) => {
    // InputNode - InputNode
    if(sourceNode.type === NodeType.Input) {
      if(sourceNode.subType === InputNodeType.Resource) {
        if(targetNode.subType === InputNodeType.Response){
          return (targetNode.output as ResponseItem).resourceIndex === sourceNode.output?.index;
        }
        else if(targetNode.subType === InputNodeType.Parameter) {
          return sourceNode.output?.index === (targetNode.output as FieldItem).responseIndex;
        }
      }
      else if (sourceNode.subType === InputNodeType.Response) {
        if(targetNode.subType === InputNodeType.Field){
          return (targetNode.output as FieldItem).responseIndex === sourceNode.output?.index;
        }
      }
      return false;
    }
    return false;
  }

  // target is PolicyNode: 
  const isPolicyConnectionValid = (sourceNode: NodeData, targetNode: NodeData) => {
    const policyType = targetNode.subType as PolicyNodeType;

    // DefaultNode - PolicyNode: [TODO] always?
    if(sourceNode.type === NodeType.Default) {
      return true;
    }

    // InputNode | PolicyNode - PolicyNode: only if the previous output is not undefined
    if(policyType === PolicyNodeType.Rename) {
      return sourceNode.output?.tag === "Resource" || sourceNode.output?.tag === "Response";
    }
    else if(policyType === PolicyNodeType.Encryption) {
      return sourceNode.output?.tag === "Response";
    }
    else if(policyType === PolicyNodeType.Projection) {
      return sourceNode.output?.tag === "Response";
    }
    return false;
  }

  const isOutputConnectionValid = (sourceNode: NodeData, targetNode: NodeData ) => {
    //Already connected
    if(targetNode.input !== undefined) return false;
    
    // Same type of Item
    if(sourceNode.output?.tag === targetNode.subType) return true;

    return false;
  }


  // DRAG AND DROP
  const dragOutsideRef = useRef<NodeData | null>(null);

  // Function called also from LeftPanel
  const onDragStart = (event: React.DragEvent<HTMLDivElement> | React.DragEvent<HTMLButtonElement>, node: NodeData) => {
    dragOutsideRef.current = node;
    event.dataTransfer.effectAllowed = 'move';
  }

  const onDragOver:React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const node = dragOutsideRef.current;

    if (!node) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    console.log(position);

    switch (node.type) {
      case NodeType.Input:
        addInputNode(node, position);
        break;
      case NodeType.Policy:
        addPolicyNode(node, position);
        break;
      case NodeType.Output:
        addOutputNode(node, position);
        break;
      case NodeType.Default:
        addDefaultNode(node, position);
        break;
      default:
        throw new Error('Unknown node type');
    }
    console.log('Drop', node);
    //dragOutsideRef.current = null;
  }

  const onDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragOutsideRef.current = null;
  }

  // ADD AND REMOVE NODES

  const {policyNodesCount, setPolicyNodesCount, outpuNodesCount, setOutputNodesCount} = useContext(GlobalContext);

  const addInputNode = (node: NodeData, position: XYPosition) => {
    const newNode = {
      id: node.output?.index.toString() + '.' + node.type + '.' + node.subType,
      position,
      type: "inputComponent",
      data: node,
    };
    setNodes((nds) => nds.concat(newNode));
    // Update the resource input so this node can no longer be added
    
    switch (node.subType) {
      case InputNodeType.Resource:
        setResourceInputs((prev: ResourceItem[]) =>
          prev.map((res) =>
          res.index === node.output?.index ? { ...res, canBeAdded: false } : res
          )
        );
        break;
      case InputNodeType.Response:
        setResourceResponseInputs((prev: ResponseItem[]) =>
          prev.map((res) =>
          res.index === node.output?.index ? { ...res, canBeAdded: false } : res
          )
        );
        break;
      case InputNodeType.Parameter:
        setResourceParametersInputs((prev: ParameterItem[]) =>
          prev.map((res) =>
          res.index === node.output?.index ? { ...res, canBeAdded: false } : res
          )
        );
        break;
      case InputNodeType.Field:
        setResourceFieldInputs((prev: FieldItem[]) =>
          prev.map((res) =>
          res.index === node.output?.index ? { ...res, canBeAdded: false } : res
          )
        );
        break;
      default:
        new Error('Unknown input node type');
        break;
    }

    console.log('Add input node', node);
  }

  const addPolicyNode = (node: NodeData, position: XYPosition) => {
    const newNode = {
      id: policyNodesCount + '.' + node.type + '.' + node.subType,
      position,
      type: "policyComponent",
      data: node,
    };
    setNodes((nds) => nds.concat(newNode));
    setPolicyNodesCount(policyNodesCount + 1);
  }

  function addOutputNode (node: NodeData, position: XYPosition)  {
    const newNode = {
      id: outpuNodesCount + '.' + node.subType,
      position,
      type: "outputComponent",
      data: node,
    };
    setNodes((nds) => nds.concat(newNode));
    setOutputNodesCount(outpuNodesCount + 1);
  }

  function addDefaultNode (node: NodeData, position: XYPosition)  {
    const newNode = {
      id: node.subType,
      position,
      type: "defaultComponent",
      data: node,
    };
    setNodes((nds) => nds.concat(newNode));

    // Update the default components so this node can no longer be added
    DEFAULT_COMPONENTS.forEach((component) => {
      if(component.type === node.subType) {
        component.available = false;
      }
    });
  }
  
  const onNodesDelete = (nodesToDelete: Node[]) => {
    console.log('Delete nodes', nodesToDelete);
    for(const node of nodesToDelete) {
      switch(node.type) {
        case 'inputComponent':
          onInputNodeDelete(node.data as NodeData);
          break;
        case 'defaultComponent':
          onDefaultNodeDelete(node.data as NodeData);
          break;
      }
    }
    setSelectedNode(undefined);
  }

  const onInputNodeDelete = (node: NodeData) => {
    const index = node.output?.index;
    const subType = node.subType;

    
    switch (subType) {
      case InputNodeType.Resource:
        setResourceInputs((prev) =>
          prev.map((res) => res.index === index ? { ...res, canBeAdded: true } : res)
        );
        break;
      case InputNodeType.Response:
        setResourceResponseInputs((prev) =>
          prev.map((res) => res.index === index ? { ...res, canBeAdded: true } : res)
        );
        break;
      case InputNodeType.Parameter:
        setResourceParametersInputs((prev) =>
          prev.map((res) => res.index === index ? { ...res, canBeAdded: true } : res)
        );
        break;
      case InputNodeType.Field:
        setResourceFieldInputs((prev) =>
          prev.map((res) => res.index === index ? { ...res, canBeAdded: true } : res)
        );
        break;
      default:
        throw new Error('Unknown input node type');
        break;
    }
  }

  const onDefaultNodeDelete = (node: NodeData) => {
    DEFAULT_COMPONENTS.forEach((component) => {
      if(component.type === node.subType) {
        component.available = true;
      }
    });
  }

  // NODE AND PANE CLICK
  const [selectedNode, setSelectedNode] = useState<Node | undefined>(undefined);

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setSelectedNode(node);
    console.log('Click on node', node);
  }

  const onPaneClick = (event: React.MouseEvent) => {
    setSelectedNode(undefined);
    setIsMenuOpen(false);
    console.log('Pane click', event);
  }

  
  const overlappingNodeRef = useRef<Node | null>(null);

  const onNodeDrag:OnNodeDrag = (_event, dragNode) => {
    overlappingNodeRef.current = getIntersectingNodes(dragNode)[0];
  }

  const onNodeDragStop:OnNodeDrag = (_event, dragNode) => {    
    // If no overlapping node, just update the position and remove the parent if present
    if(!overlappingNodeRef.current || overlappingNodeRef.current.parentId === dragNode.id) {
      if(dragNode.parentId) {
        const parent = nodes.find((node) => node.id === dragNode.parentId);
        if(!parent) return;

        const {x, y} = parent.position || {x: 0, y: 0};
        const {x: dragX, y: dragY} = dragNode?.position || {x: 0, y: 0};

        const position = {x: dragX + x, y: dragY + y};

        (parent.data as NodeData).parentOf = (parent.data as NodeData).parentOf?.filter( (id) => id !== dragNode.id);
        setNodes((prevNodes) => prevNodes.map((node) => node.id === dragNode.id ? {...node, position, parentId: undefined} : node));

        // Add edge to the parent node
        addEdge({source: parent.id, target: dragNode.id} as Connection);
        /*const newEdge = {
          id: `${parent.id}-${dragNode.id}`,
          source: parent.id,
          target: dragNode.id,
          type: 'relationConnection',
          markerEnd: baseMarkerEnd,
        };
        setEdges((eds) => eds.concat(newEdge));*/
      }
      return;
    }

    if(dragNode.type !== 'inputComponent') return; // Do not allow to drag output nodes


    const targetNode = dragNode;
    const sourceNode = overlappingNodeRef.current!;
    if ( targetNode.parentId !== sourceNode.id &&
      isValidConnection({ source: sourceNode.id, target: targetNode.id, sourceHandle: null, targetHandle: null })) {

      setNodes((prevNodes) => {
        // First filter out the target node
        const nodesWithoutTarget = prevNodes.filter(node => node.id !== targetNode.id);
        
        // Find the index of the source node
        const sourceIndex = nodesWithoutTarget.findIndex(node => node.id === sourceNode.id);
        
        if (sourceIndex === -1) return prevNodes;
        
        // Create a copy of the target node with updated position and parentId
        const updatedTarget = {
          ...targetNode,
          parentId: sourceNode.id,
          position: {
            x: dragNode.position.x - overlappingNodeRef.current!.position.x,
            y: dragNode.position.y - overlappingNodeRef.current!.position.y
          }
        };
        
        // Insert the updated target node right after the source node
        return [
          ...nodesWithoutTarget.slice(0, sourceIndex + 1),
          updatedTarget,
          ...nodesWithoutTarget.slice(sourceIndex + 1)
        ].map((node) => {
          if(node.id === dragNode.id) {
            const {x, y} = overlappingNodeRef?.current?.position || {x: 0, y: 0};
            const {x: dragX, y: dragY} = dragNode?.position || {x: 0, y: 0};

            let position = {x: dragX - x, y: dragY - y};

            // If already a child of a different node, adjust the position
            if(node.parentId && node.parentId !== overlappingNodeRef?.current?.id) {
              const parent = nodes.find((node) => node.id === dragNode.parentId);
              const parentPosition = parent?.position || {x: 0, y: 0};
              position = {x: dragX + parentPosition.x - x, y: dragY + parentPosition.y - y};
            }

            return {
              ...node,
              parentId: overlappingNodeRef?.current?.id,
              ...((!dragNode.parentId || dragNode.parentId !== overlappingNodeRef?.current?.id) && {position}), // Only update position if the node is not already a child
            };
          }
          return node;
        });
      });
        
      // Remove the edge between the source and target node, if present
      setEdges((prevEdges) => prevEdges.filter(edge => !(edge.source === sourceNode.id && edge.target === targetNode.id)));

      if(!sourceNode.data.parentOf) sourceNode.data.parentOf = [targetNode.id];
      else if(sourceNode.data.parentOf && !(sourceNode.data as NodeData).parentOf.includes(targetNode.id)) sourceNode.data.parentOf = [...(sourceNode.data as NodeData).parentOf, targetNode.id];
    }
  }

  const deletePressed = useKeyPress('Delete');
  const {deleteElements, } = useReactFlow();

  if(deletePressed) {
    const nodesToDelete = [];
    for(const node of nodes) {
      if(node.selected) {
        nodesToDelete.push(node);
      }
    }
    deleteElements({nodes: nodesToDelete});
  }

  return (
    <Box width={'100%'} height={'100vh'}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChannge}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={ConnectionLine}
        isValidConnection={isValidConnection}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        onNodesDelete={onNodesDelete}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
      >
        <LeftPanel onDragFunc={onDragStart} />
        {selectedNode && < RightPanel node={selectedNode.data as NodeData}/>}
        <Background variant={BackgroundVariant.Lines} gap={10} color = "#f1f1f1" id = "1" />
        <Background variant={BackgroundVariant.Lines} gap={100} color = "#ccc" id = "2" />
        <Controls />
      </ReactFlow>
    </Box>
  );
}

export default Workflow;

