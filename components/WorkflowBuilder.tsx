"use client";

import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  EdgeTypes,
  BackgroundVariant,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AnimatedEdge from './edges/AnimatedEdge';

import { useWorkflowStore } from '@/store/workflowStore';
import CustomNode from './nodes/CustomNode';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NodeConfigPanel from './NodeConfigPanel';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

export default function WorkflowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onConnect,
    selectedNode,
    setSelectedNode,
  } = useWorkflowStore();

  const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState(edges);

  // Track if we're syncing to prevent infinite loops
  const isSyncingToStoreRef = useRef(false);
  const lastStoreNodesRef = useRef(nodes);
  const lastStoreEdgesRef = useRef(edges);

  // Sync FROM store TO local (only when store changes externally, like templates or workflow execution)
  React.useEffect(() => {
    if (!isSyncingToStoreRef.current && lastStoreNodesRef.current !== nodes) {
      setLocalNodes(nodes);
      lastStoreNodesRef.current = nodes;
    }
  }, [nodes, setLocalNodes]);

  React.useEffect(() => {
    if (!isSyncingToStoreRef.current && lastStoreEdgesRef.current !== edges) {
      setLocalEdges(edges);
      lastStoreEdgesRef.current = edges;
    }
  }, [edges, setLocalEdges]);

  // Sync FROM local TO store (when user edits the canvas)
  React.useEffect(() => {
    isSyncingToStoreRef.current = true;
    setNodes(localNodes);
    lastStoreNodesRef.current = localNodes;
    isSyncingToStoreRef.current = false;
  }, [localNodes, setNodes]);

  React.useEffect(() => {
    isSyncingToStoreRef.current = true;
    setEdges(localEdges);
    lastStoreEdgesRef.current = localEdges;
    isSyncingToStoreRef.current = false;
  }, [localEdges, setEdges]);

  const handleConnect = useCallback((connection: Connection) => {
    onConnect(connection);
  }, [onConnect]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeData = JSON.parse(event.dataTransfer.getData('application/nodedata'));

      if (typeof type === 'undefined' || !type || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          ...nodeData,
          status: 'idle',
        },
      };

      setLocalNodes((nds) => [...nds, newNode]);
    },
    [setLocalNodes]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={localNodes}
            edges={localEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              type: 'animated',
              animated: true,
            }}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            className="canvas-grid"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(0, 0, 0, 0.1)"
            />
            <Controls
              showInteractive={false}
              className="bg-white shadow-node rounded-lg"
            />
            <MiniMap
              nodeStrokeWidth={3}
              className="bg-white shadow-node rounded-lg"
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>

        {selectedNode && <NodeConfigPanel />}
      </div>
    </div>
  );
}
