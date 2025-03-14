import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  Panel,
  useReactFlow,
  reconnectEdge,
} from '@xyflow/react';
import { Box, Flex, IconButton, Text } from '@chakra-ui/react';
import { v4 as uuid } from "uuid";
import { useCallback, useRef, useState } from 'react';
import NodeComponent from './NodeComponent';
import NodeDetail from './NodeDetail';
//import { BsPlus } from 'react-icons/bs';

const initialNodes = [
  {
    id: "1",
    type: "NodeComponent",
    position: { x: 100, y: 100 },
  },
  {
    id: "2",
    type: "NodeComponent",
    position: { x: 300, y: 100 },
  },
];

const initialEdges = [];

const nodeTypes = {
  NodeComponent: NodeComponent,
};

const Workflow = () => {
  const [nodes, setNodes, onNodesChannge] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const {screenToFlowPosition} = useReactFlow();

  const onConnect = useCallback(connection => {
    const edge = {
      ...connection,
      id: uuid(),
    };
    setEdges((eds) => eds.concat(edge));
  }, []);

  // Check if the connection is valid, TODO expand this function to check for more conditions
  const isValidConnection = (connection) => {
    const { source, target } = connection;
    console.log(source, target);
    if (source == target) return false;
    return true;
  };

  const dragOutsideref = useRef(null);

  // Drag start event handler
  const onDragStart = (event, nodeType) => {
    dragOutsideref.current = nodeType;
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  // Drop event handler, creates a new node at the position of the drop based on the type of the node
  const onDrop = (event) => {
    event.preventDefault();
    const type = dragOutsideref.current;

    if (!type) return;

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode = {
      id: uuid(),
      type: "NodeComponent", //TODO change type to the type of the node
      position,
    };
    setNodes((nds) => nds.concat(newNode));
  }

  /*
   * ON NODE CLICK
   */
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodeClick = (event, node) => {
    console.log("Node clicked", node);
    setSelectedNode(node);
  }

  const onPaneClick = () => {
    console.log("Pane clicked");
    setSelectedNode(null);
  }
  /* /END OF ON NODE CLICK  */

  /*
   * ON NODE RECONNECT
   */
  const edgeReconnectionSuccesful = useRef(false);

  /// Set the edgeReconnectionSuccesful to false when the reconnection starts for onReconnectEnd function
  const onReconnectStart = () => {
    edgeReconnectionSuccesful.current = false;
  }

  /// Remove the old edge if the reconnection is not successful
  const onReconnectEnd = (event, oldEdge) => {
    if (!edgeReconnectionSuccesful.current) {
      setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== oldEdge.id));
    }
  }

  /// Reconnect the edge and update the edges
  const onReconnect = (oldEdge, newEdge) => {
    edgeReconnectionSuccesful.current = true;
    setEdges((prevEdges) => reconnectEdge(oldEdge, newEdge, prevEdges));
  }

  /* /END OF ON NODE RECONNECT */

  return(
    <Box 
      height = {"100vh"}
      widows="100vw"
      border="1px solid black"
      position="relative"
    >
      {selectedNode && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          height={"100%"}
          width={"150px"}
          allignitems={"center"}
          bg="transparent"
          marginLeft={"12px"}
        >
          <Box
            bg="white"
            border="1px solid #ccc"
            borderRadius="12px"
            height="150px"
            width="100%"
            padding="12px"
            marginBottom={"50px"}
            position="relative"
            zIndex={1000}
          >
            <NodeDetail node={selectedNode} />
          </Box>
        </Flex>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChannge}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onReconnect={onReconnect}
      >
        <Panel
          position = "top-right" 
          style = {{border: "1px solid #ccc",
            padding: 12,
            borderRadius: 12,
            background: "white",
            width: 150
          }}>
            <Flex direction = "column" gap = {2}>
              <div>
                <Text fontSize = "x-small">Workflow</Text>
                <Flex mt = {1} gap={1} flexWrap="wrap">
                  <IconButton
                    size="sm"
                    aria-label="Add Node"
                    key = "tempIcon"
                    icon = "add" //{BsPlus}
                    onDragStart={(event) => onDragStart(event, "tempIcon")}
                    draggable
                  />
                </Flex>
              </div>
            </Flex>

        </Panel>
        <Background variant = {BackgroundVariant.Lines} gap={10} color = "#f1f1f1" id = "1"/>
        <Background variant = {BackgroundVariant.Lines} gap={100} color = "#ccc" id = "2"/>
        <Controls />
      </ReactFlow>
    </Box>
  );
}

export default Workflow;