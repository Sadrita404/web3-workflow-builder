import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '@/types/nodes';
import { motion } from 'framer-motion';

interface CustomNodeProps extends NodeProps {
  data: NodeData;
}

export default function CustomNode({ data, selected }: CustomNodeProps) {
  const getStatusStyles = () => {
    switch (data.status) {
      case 'running':
        return {
          border: 'border-blue-500',
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
          text: 'text-blue-700'
        };
      case 'success':
        return {
          border: 'border-green-500',
          bg: 'bg-gradient-to-br from-green-50 to-green-100',
          glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]',
          text: 'text-green-700'
        };
      case 'error':
        return {
          border: 'border-red-500',
          bg: 'bg-gradient-to-br from-red-50 to-red-100',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
          text: 'text-red-700'
        };
      default:
        return {
          border: 'border-gray-300',
          bg: 'bg-gradient-to-br from-white to-gray-50',
          glow: '',
          text: 'text-gray-800'
        };
    }
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case 'running':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Running
          </div>
        );
      case 'success':
        return (
          <div className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
            ✓ Done
          </div>
        );
      case 'error':
        return (
          <div className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
            ✕ Error
          </div>
        );
      default:
        return (
          <div className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
            Idle
          </div>
        );
    }
  };

  const styles = getStatusStyles();

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: selected ? 1.05 : 1,
        opacity: 1
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={`
        relative
        ${styles.bg} rounded-xl shadow-lg px-5 py-4 w-[220px] border-2
        ${styles.border}
        ${styles.glow}
        ${selected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
        hover:shadow-xl transition-all duration-200 cursor-pointer
        backdrop-blur-sm
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
        style={{ top: -6 }}
      />

      {/* Loading Spinner Overlay */}
      {data.status === 'running' && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-xl backdrop-blur-[2px] z-10">
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          </motion.div>
        </div>
      )}

      {/* Icon Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`text-3xl ${data.status === 'running' ? 'animate-pulse' : ''}`}>
            {data.icon}
          </div>
          <div className="flex flex-col">
            <div className={`font-bold text-sm ${styles.text}`}>
              {data.label}
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-2">
        {getStatusBadge()}
      </div>

      {/* Error Message */}
      {data.status === 'error' && data.error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded-lg border border-red-200"
        >
          {data.error}
        </motion.div>
      )}

      {/* Success Message */}
      {data.status === 'success' && data.output && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded-lg border border-green-200 text-center font-medium"
        >
          Successfully Completed
        </motion.div>
      )}

      {/* Execution Progress Bar */}
      {data.status === 'running' && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-2 h-1 bg-blue-500 rounded-full"
        />
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors"
        style={{ bottom: -6 }}
      />
    </motion.div>
  );
}
