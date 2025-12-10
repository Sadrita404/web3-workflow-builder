"use client";

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine edge color and animation based on node status
  const getEdgeState = () => {
    // When target is running, show active flow
    if (data?.targetStatus === 'running') {
      return {
        color: '#3b82f6',
        strokeWidth: 3,
        animated: true,
        showParticles: true,
        particleColor: 'bg-blue-500',
        glowColor: 'rgba(59, 130, 246, 0.4)'
      };
    }
    // When source is completed, show success flow
    if (data?.sourceStatus === 'success') {
      return {
        color: '#10b981',
        strokeWidth: 2.5,
        animated: true,
        showParticles: true,
        particleColor: 'bg-green-500',
        glowColor: 'rgba(16, 185, 129, 0.3)'
      };
    }
    // When source has error
    if (data?.sourceStatus === 'error') {
      return {
        color: '#ef4444',
        strokeWidth: 2,
        animated: false,
        showParticles: false,
        particleColor: 'bg-red-500',
        glowColor: 'rgba(239, 68, 68, 0.3)'
      };
    }
    // Default idle state
    return {
      color: '#cbd5e1',
      strokeWidth: 2,
      animated: false,
      showParticles: false,
      particleColor: 'bg-gray-400',
      glowColor: 'transparent'
    };
  };

  const edgeState = getEdgeState();

  return (
    <>
      {/* Glow effect layer */}
      {edgeState.animated && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: edgeState.glowColor,
            strokeWidth: edgeState.strokeWidth + 4,
            filter: 'blur(4px)',
            opacity: 0.6,
          }}
        />
      )}

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeState.color,
          strokeWidth: edgeState.strokeWidth,
          animation: edgeState.animated ? 'dashdraw 1s linear infinite' : 'none',
          strokeDasharray: edgeState.animated ? '10, 10' : 'none',
          filter: edgeState.animated ? 'drop-shadow(0 0 4px currentColor)' : 'none',
        }}
      />

      <EdgeLabelRenderer>
        {/* Animated particles flowing along the edge */}
        {edgeState.showParticles && (
          <>
            {[0, 1, 2].map((index) => (
              <div
                key={`particle-${index}`}
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                  pointerEvents: 'none',
                  animation: `flow-particle ${1.5}s ease-in-out infinite`,
                  animationDelay: `${index * 0.5}s`,
                }}
                className="nodrag nopan"
              >
                <div className={`w-3 h-3 ${edgeState.particleColor} rounded-full shadow-lg`}>
                  <div className={`w-3 h-3 ${edgeState.particleColor} rounded-full animate-ping`} />
                </div>
              </div>
            ))}
          </>
        )}
      </EdgeLabelRenderer>

      <style jsx global>{`
        @keyframes dashdraw {
          to {
            stroke-dashoffset: -20;
          }
        }

        @keyframes flow-particle {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(${sourceX}px, ${sourceY}px) scale(0.5);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(${sourceX}px, ${sourceY}px) scale(1);
          }
          90% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(${targetX}px, ${targetY}px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(${targetX}px, ${targetY}px) scale(0.5);
          }
        }
      `}</style>
    </>
  );
}
