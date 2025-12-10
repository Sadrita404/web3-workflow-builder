"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  Blocks,
  ChevronLeft,
  ChevronRight,
  Search,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { nodeConfigs, NodeType } from '@/types/nodes';
import { contractTemplates, getTemplateById } from '@/lib/contractTemplates';
import { useWorkflowStore } from '@/store/workflowStore';
import { useWorkflowExecution } from '@/lib/useWorkflowExecution';
import { generateWorkflowFromTemplate } from '@/lib/templateWorkflowGenerator';
import { toast } from 'react-toastify';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'nodes' | 'templates'>('nodes');
  const [searchQuery, setSearchQuery] = useState('');
  const { sidebarCollapsed, setSidebarCollapsed, setNodes, setEdges, currentProject, createProject } = useWorkflowStore();
  const { runWorkflow, stopWorkflow, resetWorkflow, isExecuting } = useWorkflowExecution();

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    const config = nodeConfigs[nodeType];
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodedata', JSON.stringify({
      label: config.label,
      type: nodeType,
      icon: config.icon,
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) {
      toast.error('Template not found');
      return;
    }

    // Create a new project if none exists
    if (!currentProject) {
      createProject(`${template.name} Project`, template.description);
    }

    // Generate workflow from template
    const { nodes, edges } = generateWorkflowFromTemplate(template);
    setNodes(nodes);
    setEdges(edges);

    toast.success(`${template.name} template loaded! ${nodes.length} nodes created.`);
  };

  const filteredNodes = Object.values(nodeConfigs).filter(node =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = contractTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedNodes = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, typeof filteredNodes>);

  if (sidebarCollapsed) {
    return (
      <motion.div
        initial={false}
        animate={{ width: 60 }}
        className="bg-white border-r border-gray-200 flex flex-col items-center py-4 shadow-sm"
      >
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex-1 flex flex-col gap-4 mt-8">
          <button
            type="button"
            onClick={() => {
              setSidebarCollapsed(false);
              setActiveTab('nodes');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Nodes"
          >
            <Blocks className="w-5 h-5 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSidebarCollapsed(false);
              setActiveTab('templates');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Templates"
          >
            <Code className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: 320 }}
      className="bg-white border-r border-gray-200 flex flex-col shadow-sm"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Workflow Library</h2>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('nodes')}
          className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
            activeTab === 'nodes'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Blocks className="w-4 h-4" />
            <span>Nodes</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
            activeTab === 'templates'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Code className="w-4 h-4" />
            <span>Templates</span>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          {activeTab === 'nodes' ? (
            <motion.div
              key="nodes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {Object.entries(groupedNodes).map(([category, nodes]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {nodes.map((node) => (
                      <div
                        key={node.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                        className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-secondary hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{node.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-800 group-hover:text-secondary transition-colors">
                              {node.label}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {node.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="p-4 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:border-secondary hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-800 group-hover:text-secondary transition-colors">
                          {template.name}
                        </h4>
                        <span className="text-xs px-2 py-1 bg-secondary bg-opacity-10 text-secondary rounded-full">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Execution Controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Execution
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={runWorkflow}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">Run</span>
          </button>
          <button
            type="button"
            onClick={stopWorkflow}
            disabled={!isExecuting}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetWorkflow}
            disabled={isExecuting}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
