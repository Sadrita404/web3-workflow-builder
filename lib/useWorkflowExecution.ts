import { useCallback, useRef } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { WorkflowExecutor } from './workflowExecutor';
import { toast } from 'react-toastify';
import { NodeData } from '@/types/nodes';

export function useWorkflowExecution() {
  const {
    nodes,
    edges,
    selectedNetwork,
    updateNode,
    setEdges,
    setExecutionState,
    isExecuting,
    setIsExecuting,
    resetExecution,
  } = useWorkflowStore();

  const executorRef = useRef<WorkflowExecutor | null>(null);

  const runWorkflow = useCallback(async () => {
    if (isExecuting) {
      toast.warning('Workflow is already running');
      return;
    }

    if (nodes.length === 0) {
      toast.error('No nodes in workflow. Please add some nodes first.');
      return;
    }

    setIsExecuting(true);
    resetExecution();

    const executor = new WorkflowExecutor({
      nodes,
      edges,
      selectedNetwork,
      onNodeUpdate: (nodeId, data) => {
        updateNode(nodeId, data);
      },
      onNodeStatus: (nodeId, status) => {
        setExecutionState(nodeId, { status });
      },
      onEdgeUpdate: (updatedEdges) => {
        setEdges(updatedEdges);
      },
    });

    executorRef.current = executor;

    toast.info('Starting workflow execution...');

    const result = await executor.execute();

    if (result.success) {
      toast.success('Workflow completed successfully!');
    } else {
      toast.error(result.message);
    }

    setIsExecuting(false);
    executorRef.current = null;
  }, [
    nodes,
    edges,
    selectedNetwork,
    updateNode,
    setEdges,
    setExecutionState,
    isExecuting,
    setIsExecuting,
    resetExecution,
  ]);

  const stopWorkflow = useCallback(() => {
    if (executorRef.current) {
      executorRef.current.stop();
      toast.info('Stopping workflow execution...');
    }
  }, []);

  const resetWorkflow = useCallback(() => {
    resetExecution();
    // Reset all node statuses
    nodes.forEach((node) => {
      updateNode(node.id, {
        status: 'idle',
        output: undefined,
        error: undefined,
      } as Partial<NodeData>);
    });
    toast.info('Workflow reset');
  }, [nodes, updateNode, resetExecution]);

  return {
    runWorkflow,
    stopWorkflow,
    resetWorkflow,
    isExecuting,
  };
}
