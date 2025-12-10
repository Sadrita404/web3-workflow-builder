"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Copy } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { NodeData } from '@/types/nodes';
import ConstructorArgsInput from './ConstructorArgsInput';
import { extractConstructorParams, formatConstructorArgs } from '@/lib/constructorParser';

export default function NodeConfigPanel() {
  const { selectedNode, updateNode, removeNode, setSelectedNode, nodes } = useWorkflowStore();
  const [nodeData, setNodeData] = useState<NodeData | null>(null);

  useEffect(() => {
    if (selectedNode) {
      setNodeData(selectedNode.data as NodeData);
    }
  }, [selectedNode]);

  // Find ABI from previous generateABI node for dynamic constructor params
  const contractABI = useMemo(() => {
    if (!selectedNode || nodeData?.type !== 'deploy') return null;

    // Check if node already has ABI
    if (nodeData.abi && Array.isArray(nodeData.abi)) {
      return nodeData.abi;
    }

    // Find previous generateABI node
    const abiNode = nodes.find(n => n.data.type === 'generateABI' && n.data.abi);
    return abiNode?.data.abi || null;
  }, [selectedNode, nodeData, nodes]);

  // Extract constructor params from ABI
  const constructorParams = useMemo(() => {
    if (!contractABI || !Array.isArray(contractABI)) return [];
    return extractConstructorParams(contractABI);
  }, [contractABI]);

  if (!selectedNode || !nodeData) return null;

  const handleDataChange = (key: string, value: any) => {
    const updatedData = { ...nodeData, [key]: value };
    setNodeData(updatedData);
    updateNode(selectedNode.id, updatedData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      removeNode(selectedNode.id);
      setSelectedNode(null);
    }
  };

  const renderConfigFields = () => {
    switch (nodeData.type) {
      case 'projectCreate':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title
              </label>
              <input
                type="text"
                value={nodeData.projectTitle || ''}
                onChange={(e) => handleDataChange('projectTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                placeholder="My Smart Contract Project"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={nodeData.projectDescription || ''}
                onChange={(e) => handleDataChange('projectDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none"
                placeholder="Describe your project..."
                rows={3}
              />
            </div>
          </>
        );

      case 'contractInput':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Name
              </label>
              <input
                type="text"
                value={nodeData.contractName || ''}
                onChange={(e) => handleDataChange('contractName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                placeholder="MyContract"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solidity Code
              </label>
              <textarea
                value={nodeData.contractCode || ''}
                onChange={(e) => handleDataChange('contractCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none font-mono text-xs"
                placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.20;&#10;&#10;contract MyContract {&#10;  // Your code here&#10;}"
                rows={12}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Upload File
              </label>
              <input
                type="file"
                accept=".sol"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      handleDataChange('contractCode', content);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-sm"
              />
            </div>
          </>
        );

      case 'compile':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compiler Version
            </label>
            <select
              value={nodeData.compilerVersion || '0.8.20'}
              onChange={(e) => handleDataChange('compilerVersion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            >
              <option value="0.8.28">v0.8.28 (latest)</option>
              <option value="0.8.27">v0.8.27</option>
              <option value="0.8.26">v0.8.26</option>
              <option value="0.8.25">v0.8.25</option>
              <option value="0.8.24">v0.8.24</option>
              <option value="0.8.23">v0.8.23</option>
              <option value="0.8.22">v0.8.22</option>
              <option value="0.8.21">v0.8.21</option>
              <option value="0.8.20">v0.8.20</option>
            </select>
            {nodeData.compilationResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  ✓ Compilation Successful
                </p>
              </div>
            )}
            {nodeData.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">
                  Compilation Error:
                </p>
                <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap">
                  {nodeData.error}
                </pre>
              </div>
            )}
          </div>
        );

      case 'generateABI':
        return (
          <div className="mb-4">
            {nodeData.abi ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated ABI
                </label>
                <div className="relative">
                  <pre className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs overflow-x-auto max-h-80 overflow-y-auto">
                    {JSON.stringify(nodeData.abi, null, 2)}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(nodeData.abi, null, 2));
                    }}
                    className="absolute top-2 right-2 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Copy ABI"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-500">
                  ABI will be generated after compilation
                </p>
              </div>
            )}
          </div>
        );

      case 'generateBytecode':
        return (
          <div className="mb-4">
            {nodeData.bytecode ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Bytecode
                </label>
                <div className="relative">
                  <textarea
                    value={nodeData.bytecode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs font-mono resize-none"
                    rows={8}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(nodeData.bytecode || '');
                    }}
                    className="absolute top-2 right-2 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    title="Copy Bytecode"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-500">
                  Bytecode will be generated after compilation
                </p>
              </div>
            )}
          </div>
        );

      case 'deploy':
        return (
          <>
            <div className="mb-4">
              {constructorParams.length > 0 ? (
                <ConstructorArgsInput
                  params={constructorParams}
                  values={nodeData.constructorArgsValues || []}
                  onChange={(values) => {
                    // Store both the string values and the formatted args
                    handleDataChange('constructorArgsValues', values);
                    const formattedArgs = formatConstructorArgs(constructorParams, values);
                    handleDataChange('constructorArgs', formattedArgs);
                  }}
                  disabled={!!nodeData.deployedAddress}
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Constructor Arguments
                  </label>
                  <textarea
                    value={JSON.stringify(nodeData.constructorArgs || [])}
                    onChange={(e) => {
                      try {
                        const args = JSON.parse(e.target.value);
                        handleDataChange('constructorArgs', args);
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    disabled={!!nodeData.deployedAddress}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none font-mono text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder='["MyToken", "MTK", "1000000"]'
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Enter constructor arguments as JSON array, or connect to a Generate ABI node for dynamic fields
                  </p>
                </div>
              )}
            </div>

            {nodeData.deployedAddress && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 font-medium mb-2">
                  ✓ Deployed Successfully
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Address:</span>{' '}
                    <span className="font-mono">{nodeData.deployedAddress}</span>
                  </p>
                  {nodeData.transactionHash && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">TX Hash:</span>{' '}
                      <span className="font-mono break-all">
                        {nodeData.transactionHash}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        );

      case 'aiAudit':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Prompt
              </label>
              <textarea
                value={nodeData.aiPrompt || 'Analyze this smart contract for security vulnerabilities and suggest improvements.'}
                onChange={(e) => handleDataChange('aiPrompt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent resize-none"
                placeholder="Enter your prompt for AI analysis..."
                rows={4}
              />
            </div>
            {nodeData.aiResponse && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Response
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {nodeData.aiResponse}
                  </pre>
                </div>
              </div>
            )}
          </>
        );

      case 'completion':
        return (
          <div className="mb-4">
            {nodeData.summary ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-2">
                  ✓ Workflow Completed
                </p>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {nodeData.summary}
                </pre>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-500">
                  Summary will be generated after workflow execution
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-sm text-gray-500">
              No configuration options available for this node
            </p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-panel overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{nodeData.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{nodeData.label}</h3>
            <p className="text-xs text-gray-500">Node Configuration</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Status Badge */}
      {nodeData.status && nodeData.status !== 'idle' && (
        <div className="px-4 py-2 border-b border-gray-200">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              nodeData.status === 'running'
                ? 'bg-secondary bg-opacity-10 text-secondary'
                : nodeData.status === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {nodeData.status === 'running' && (
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            )}
            {nodeData.status === 'success' && '✓'}
            {nodeData.status === 'error' && '✕'}
            <span className="capitalize">{nodeData.status}</span>
          </div>
        </div>
      )}

      {/* Config Fields */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderConfigFields()}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Node</span>
        </button>
      </div>
    </motion.div>
  );
}
