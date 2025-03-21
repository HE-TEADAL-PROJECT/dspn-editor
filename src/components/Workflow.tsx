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
  reconnectEdge,
  OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useContext, useRef, useState } from 'react';
import { InputComponent, OutputComponent, PolicyComponent } from './diagramComponents/NodeComponent';
import { InputNodeType, nodeComponent, NodeType } from '../types/nodeTypes';
import RelationConnection from './diagramComponents/RelationConnection';
import { baseMarkerEnd } from '../constants/nodesDefinitions';
import ConnectionLine from './diagramComponents/ConnectionLine';
import LeftPanel from './LeftPanel';
import { GlobalContext } from './GlobalContext';

const nodeTypes = {
  inputComponent: InputComponent,
  policyComponent: PolicyComponent,
  outputComponent: OutputComponent,
}

const edgeTypes = {
  relationConnection: RelationConnection,
}

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

const Workflow = () => {
  const [nodes, setNodes, onNodesChannge] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { setResourceInputs, setResourceSchemaInputs, setResourceFieldInputs } = useContext(GlobalContext);
  const { setIsMenuOpen } = useContext(GlobalContext);
  
  const {screenToFlowPosition, getIntersectingNodes } = useReactFlow();

  const onConnect = useCallback((connection: Connection) => {
    const edge = {
      ...connection,
      type: 'relationConnection',
      id: `${connection.source}-${connection.target}`,
      markerEnd: baseMarkerEnd,
    };
    setEdges((eds) => eds.concat(edge));
  }, []);


  const isValidConnection = (connection: Edge | Connection) => {
    console.log('Connection', connection);
      const {source, target} = connection;
      // Not allow connection to the same node
      if (source === target) {
        return false;
      }
      
      const sourceNode = nodes.find((node) => node.id === source)?.data.node as nodeComponent;
      const targetNode = nodes.find((node) => node.id === target)?.data.node as nodeComponent;

      console.log('Source node', sourceNode);
      console.log('Target node', targetNode);

      if(!sourceNode || !targetNode) return false;
  
      if(sourceNode.type === NodeType.Input && targetNode.type === NodeType.Input) {
        return targetNode.canBeConnectedTo.includes(sourceNode.id);
      }

      return false;
    }

  const dragOutsideRef = useRef<nodeComponent | null>(null);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, node: nodeComponent) => {
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
    }
  }

  const addInputNode = (node: nodeComponent, position: XYPosition) => {
    const newNode = {
      id: node.id,
      position,
      type: "inputComponent",
      data: { label: node.label, type: node.subType as InputNodeType, node: node },
    };
    setNodes((nds) => nds.concat(newNode));
    // Update the resource input so this node can no longer be added
    const setFunc = node.subType === InputNodeType.Resource ? setResourceInputs : node.subType === InputNodeType.Schema ? setResourceSchemaInputs : setResourceFieldInputs;
    setFunc((prev: nodeComponent[]) =>
      prev.map((res: nodeComponent) =>
        res.id === node.id ? { ...res, canBeAdded: false } : res
      )
    );
  }

  const addPolicyNode = (node: nodeComponent, position: XYPosition) => {
    const newNode = {
      id: node.id,
      position,
      type: "policyComponent",
      data: { label: node.label },
    };
    setNodes((nds) => nds.concat(newNode));
  }

  const addOutputNode = (node: nodeComponent, position: XYPosition) => {
    const newNode = {
      id: node.id,
      position,
      type: "outputComponent",
      data: { label: node.label },
    };
    setNodes((nds) => nds.concat(newNode));
  }

  
  const onNodesDelete = (nodesToDelete: Node[]) => {
    console.log('Delete nodes', nodesToDelete);
    for(const node of nodesToDelete) {
      if(node.type === "inputComponent") {
        setResourceInputs((prev) => prev.map((res) => res.id === node.id ? {...res, canBeAdded: true} : res));
        setResourceSchemaInputs((prev) => prev.map((res) => res.id === node.id ? {...res, canBeAdded: true} : res));
        setResourceFieldInputs((prev) => prev.map((res) => res.id === node.id ? {...res, canBeAdded: true} : res));
      }
    }
  }


  const [selectdNode, setSelectedNode] = useState<Node | undefined>(undefined);


  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setSelectedNode(node);
    console.log('Click on node', selectdNode, node);
  }

  const onPaneClick = (event: React.MouseEvent) => {
    setSelectedNode(undefined);
    setIsMenuOpen(false);
    console.log('Pane click', event);
  }

  const edgeReconnectSuccessful = useRef(false);

  const onReconnectStart = () => {
    edgeReconnectSuccessful.current = false;
  }

  const onReconnect:OnReconnect = (oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true;
    setEdges((pevEdges) => reconnectEdge(oldEdge, newConnection, pevEdges));
  }

  const onReconnectEnd = (_:MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((pevEdges) => pevEdges.filter((e) => e.id !== edge.id));
    }
  }

  const overlappingNodeRef = useRef<Node | null>(null);

  const onNodeDrag:OnNodeDrag = (_event, dragNode) => {
    overlappingNodeRef.current = getIntersectingNodes(dragNode)[0];
  }

  const onNodeDragStop:OnNodeDrag = (_event, dragNode) => {
    // If no overlapping node, just update the position and remove the parent if present
    if(!overlappingNodeRef.current){
      if(dragNode.parentId) {
        const parent = nodes.find((node) => node.id === dragNode.parentId);

        const {x, y} = parent?.position || {x: 0, y: 0};
        const {x: dragX, y: dragY} = dragNode?.position || {x: 0, y: 0};

        const position = {x: dragX + x, y: dragY + y};
        if(parent?.type === "inputComponent") {
          console.log((parent.data.node as nodeComponent).parentOf, dragNode.id);
          (parent.data.node as nodeComponent).parentOf = (parent.data.node as nodeComponent).parentOf?.filter(
            (id) => id !== dragNode.id
          );
          console.log((parent.data.node as nodeComponent).parentOf);
        }
        setNodes((prevNodes) => prevNodes.map((node) => node.id === dragNode.id ? {...node, position, parentId: undefined} : node));
        
      }
      return;
    }

    const sourceNode = dragNode.data.node as nodeComponent;
    const targetNode = overlappingNodeRef.current!.data.node as nodeComponent;

    if (sourceNode.canBeConnectedTo.includes(targetNode.id)) {
      /*setNodes((prevNodes) => {
        //TODO: optimize estraendo cambiamento dragNode
        prevNodes.map((node) => {
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
        })

        const newNodes: Node[] = [];
        for(const currNode of prevNodes){
          if(currNode.id !== dragNode.id){
            newNodes.push(currNode);
          }
          else if(currNode.id === overlappingNodeRef.current?.id){
            newNodes.push(currNode);
            newNodes.push(dragNode);
          }
        }
        return newNodes;
      })*/

      setNodes((prevNodes) => [
        overlappingNodeRef?.current as Node,
        ...prevNodes
          .filter((node) => node.id !== overlappingNodeRef?.current?.id)
          .map((node) => {
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
          })
        ]);
      if(!targetNode.parentOf) targetNode.parentOf = [sourceNode.id];
      else if(targetNode.parentOf && !targetNode.parentOf.includes(sourceNode.id)) targetNode.parentOf = [...targetNode.parentOf, sourceNode.id];
     }
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
        <Background variant={BackgroundVariant.Lines} gap={10} color = "#f1f1f1" id = "1" />
        <Background variant={BackgroundVariant.Lines} gap={100} color = "#ccc" id = "2" />
        <Controls />
      </ReactFlow>
    </Box>
  );
}

export default Workflow;

