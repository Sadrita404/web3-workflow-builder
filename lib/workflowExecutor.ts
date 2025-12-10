import { Node, Edge } from '@xyflow/react';
import { NodeData, NodeType } from '@/types/nodes';
import { compileContract, extractContractName, validateSolidityCode } from './contractCompiler';
import { connectWallet, deployContract, switchNetwork } from './blockchainService';
import { analyzeContract } from './openaiService';
import { Network } from '@/store/workflowStore';

export interface ExecutionContext {
  nodes: Node[];
  edges: Edge[];
  selectedNetwork: Network | null;
  onNodeUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
  onEdgeUpdate?: (edges: Edge[]) => void;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
}

export class WorkflowExecutor {
  private context: ExecutionContext;
  private executionData: Map<string, any> = new Map();
  private stopped: boolean = false;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  public stop() {
    this.stopped = true;
  }

  public async execute(): Promise<ExecutionResult> {
    this.stopped = false;
    this.executionData.clear();

    try {
      // Build execution order from edges
      const executionOrder = this.buildExecutionOrder();

      if (executionOrder.length === 0) {
        return {
          success: false,
          message: 'No nodes to execute. Please add nodes to your workflow.',
        };
      }

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        if (this.stopped) {
          return {
            success: false,
            message: 'Workflow execution stopped by user',
          };
        }

        const node = this.context.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        const result = await this.executeNode(node);

        if (!result.success) {
          return {
            success: false,
            message: `Failed at node "${node.data.label}": ${result.message}`,
          };
        }

        // Store execution data
        this.executionData.set(nodeId, result.data);
      }

      // Generate completion summary
      const summary = this.generateSummary();

      return {
        success: true,
        message: 'Workflow executed successfully',
        data: { summary, executionData: Object.fromEntries(this.executionData) },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Unknown error during workflow execution',
      };
    }
  }

  private buildExecutionOrder(): string[] {
    const { nodes, edges } = this.context;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    });

    // Build graph
    edges.forEach((edge) => {
      adjacencyList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Topological sort (Kahn's algorithm)
    const queue: string[] = [];
    const result: string[] = [];

    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      adjacencyList.get(nodeId)?.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // If result doesn't include all nodes, there's a cycle
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains a cycle. Please check your connections.');
    }

    return result;
  }

  private updateEdgeStatus(nodeId: string, status: 'idle' | 'running' | 'success' | 'error') {
    if (!this.context.onEdgeUpdate) return;

    const updatedEdges = this.context.edges.map(edge => {
      // Update edges connected to this node
      if (edge.source === nodeId) {
        return {
          ...edge,
          data: { ...edge.data, sourceStatus: status }
        };
      }
      if (edge.target === nodeId) {
        return {
          ...edge,
          data: { ...edge.data, targetStatus: status }
        };
      }
      return edge;
    });

    this.context.onEdgeUpdate(updatedEdges);
  }

  private async executeNode(node: Node): Promise<ExecutionResult> {
    const nodeData = node.data as NodeData;
    const nodeType = nodeData.type;

    // Update status to running
    this.context.onNodeStatus(node.id, 'running');
    this.updateEdgeStatus(node.id, 'running');

    try {
      let result: ExecutionResult;

      switch (nodeType) {
        case 'projectCreate':
          result = await this.executeProjectCreate(node);
          break;
        case 'contractInput':
          result = await this.executeContractInput(node);
          break;
        case 'compile':
          result = await this.executeCompile(node);
          break;
        case 'generateABI':
          result = await this.executeGenerateABI(node);
          break;
        case 'generateBytecode':
          result = await this.executeGenerateBytecode(node);
          break;
        case 'deploy':
          result = await this.executeDeploy(node);
          break;
        case 'aiAudit':
          result = await this.executeAIAudit(node);
          break;
        case 'completion':
          result = await this.executeCompletion(node);
          break;
        default:
          result = {
            success: false,
            message: `Unknown node type: ${nodeType}`,
          };
      }

      if (result.success) {
        this.context.onNodeStatus(node.id, 'success');
        this.updateEdgeStatus(node.id, 'success');
        this.context.onNodeUpdate(node.id, { output: result.data });
      } else {
        this.context.onNodeStatus(node.id, 'error');
        this.updateEdgeStatus(node.id, 'error');
        this.context.onNodeUpdate(node.id, { error: result.message });
      }

      // Small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 500));

      return result;
    } catch (error: any) {
      this.context.onNodeStatus(node.id, 'error');
      this.updateEdgeStatus(node.id, 'error');
      this.context.onNodeUpdate(node.id, { error: error.message });

      return {
        success: false,
        message: error.message || 'Node execution failed',
      };
    }
  }

  private async executeProjectCreate(node: Node): Promise<ExecutionResult> {
    const nodeData = node.data as NodeData;

    if (!nodeData.projectTitle) {
      return {
        success: false,
        message: 'Project title is required',
      };
    }

    return {
      success: true,
      message: 'Project initialized',
      data: {
        title: nodeData.projectTitle,
        description: nodeData.projectDescription || '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async executeContractInput(node: Node): Promise<ExecutionResult> {
    const nodeData = node.data as NodeData;

    if (!nodeData.contractCode) {
      return {
        success: false,
        message: 'Contract code is required',
      };
    }

    const validation = validateSolidityCode(nodeData.contractCode);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message || 'Invalid Solidity code',
      };
    }

    // Extract contract name if not provided
    let contractName = nodeData.contractName;
    if (!contractName) {
      const extracted = extractContractName(nodeData.contractCode);
      if (!extracted) {
        return {
          success: false,
          message: 'Could not extract contract name. Please specify it manually.',
        };
      }
      contractName = extracted;
      this.context.onNodeUpdate(node.id, { contractName });
    }

    return {
      success: true,
      message: 'Contract code validated',
      data: {
        contractCode: nodeData.contractCode,
        contractName,
      },
    };
  }

  private async executeCompile(node: Node): Promise<ExecutionResult> {
    const nodeData = node.data as NodeData;

    // Get contract code from previous node
    const contractData = this.findPreviousData('contractInput');
    if (!contractData?.contractCode) {
      return {
        success: false,
        message: 'No contract code found. Please add a Contract Input node before compilation.',
      };
    }

    const compilerVersion = nodeData.compilerVersion || '0.8.20';

    const result = await compileContract(
      contractData.contractCode,
      contractData.contractName,
      compilerVersion
    );

    if (!result.success) {
      return {
        success: false,
        message: result.errors?.join('\n') || 'Compilation failed',
      };
    }

    this.context.onNodeUpdate(node.id, {
      compilationResult: result,
    });

    return {
      success: true,
      message: 'Contract compiled successfully',
      data: result,
    };
  }

  private async executeGenerateABI(node: Node): Promise<ExecutionResult> {
    const compilationResult = this.findPreviousData('compile');

    if (!compilationResult?.abi) {
      return {
        success: false,
        message: 'No compilation result found. Please compile the contract first.',
      };
    }

    this.context.onNodeUpdate(node.id, {
      abi: compilationResult.abi,
    });

    return {
      success: true,
      message: 'ABI generated successfully',
      data: { abi: compilationResult.abi },
    };
  }

  private async executeGenerateBytecode(node: Node): Promise<ExecutionResult> {
    const compilationResult = this.findPreviousData('compile');

    if (!compilationResult?.bytecode) {
      return {
        success: false,
        message: 'No compilation result found. Please compile the contract first.',
      };
    }

    this.context.onNodeUpdate(node.id, {
      bytecode: compilationResult.bytecode,
    });

    return {
      success: true,
      message: 'Bytecode generated successfully',
      data: { bytecode: compilationResult.bytecode },
    };
  }

  private async executeDeploy(node: Node): Promise<ExecutionResult> {
    const nodeData = node.data as NodeData;

    // Get ABI and bytecode
    const abiData = this.findPreviousData('generateABI');
    const bytecodeData = this.findPreviousData('generateBytecode');

    if (!abiData?.abi || !bytecodeData?.bytecode) {
      return {
        success: false,
        message: 'ABI and bytecode are required. Please generate them first.',
      };
    }

    // Check network selection
    if (!this.context.selectedNetwork) {
      return {
        success: false,
        message: 'No network selected. Please select a network from the top bar.',
      };
    }

    // Connect wallet
    const wallet = await connectWallet();
    if (!wallet) {
      return {
        success: false,
        message: 'Failed to connect wallet. Please connect MetaMask.',
      };
    }

    // Switch to selected network if needed
    if (wallet.chainId !== this.context.selectedNetwork.chainId) {
      await switchNetwork(this.context.selectedNetwork.chainId);
    }

    // Get constructor args - ensure it's an array
    let constructorArgs = nodeData.constructorArgs || [];

    // If constructorArgs is not an array, try to parse it
    if (!Array.isArray(constructorArgs)) {
      try {
        constructorArgs = JSON.parse(constructorArgs);
      } catch {
        constructorArgs = [];
      }
    }

    // Log for debugging
    console.log('Constructor args for deployment:', constructorArgs);
    console.log('ABI:', abiData.abi);

    // Deploy contract
    const deployResult = await deployContract(
      abiData.abi,
      bytecodeData.bytecode,
      constructorArgs,
      wallet.signer
    );

    if (!deployResult.success) {
      return {
        success: false,
        message: deployResult.error || 'Deployment failed',
      };
    }

    this.context.onNodeUpdate(node.id, {
      deployedAddress: deployResult.contractAddress,
      transactionHash: deployResult.transactionHash,
    });

    return {
      success: true,
      message: 'Contract deployed successfully',
      data: deployResult,
    };
  }

  private async executeAIAudit(node: Node): Promise<ExecutionResult> {
    const nodeData = node.data as NodeData;

    // Get contract code
    const contractData = this.findPreviousData('contractInput');
    if (!contractData?.contractCode) {
      return {
        success: false,
        message: 'No contract code found for analysis.',
      };
    }

    const prompt = nodeData.aiPrompt || 'Analyze this smart contract for security vulnerabilities and suggest improvements.';

    const result = await analyzeContract(contractData.contractCode, prompt);

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'AI analysis failed',
      };
    }

    this.context.onNodeUpdate(node.id, {
      aiResponse: result.response,
    });

    return {
      success: true,
      message: 'AI analysis completed',
      data: { response: result.response },
    };
  }

  private async executeCompletion(node: Node): Promise<ExecutionResult> {
    const summary = this.generateSummary();

    this.context.onNodeUpdate(node.id, {
      summary,
    });

    return {
      success: true,
      message: 'Workflow completed',
      data: { summary },
    };
  }

  private findPreviousData(nodeType: NodeType): any {
    for (const [nodeId, data] of this.executionData.entries()) {
      const node = this.context.nodes.find((n) => n.id === nodeId);
      if (node && (node.data as NodeData).type === nodeType) {
        return data;
      }
    }
    return null;
  }

  private generateSummary(): string {
    const lines: string[] = ['Workflow Execution Summary', '=' .repeat(40), ''];

    const projectData = this.findPreviousData('projectCreate');
    if (projectData) {
      lines.push(`Project: ${projectData.title}`);
      if (projectData.description) {
        lines.push(`Description: ${projectData.description}`);
      }
      lines.push('');
    }

    const contractData = this.findPreviousData('contractInput');
    if (contractData) {
      lines.push(`Contract Name: ${contractData.contractName}`);
    }

    const compileData = this.findPreviousData('compile');
    if (compileData) {
      lines.push('✓ Compilation: Success');
    }

    const deployData = this.findPreviousData('deploy');
    if (deployData) {
      lines.push(`✓ Deployment: Success`);
      lines.push(`  Contract Address: ${deployData.contractAddress}`);
      lines.push(`  Transaction Hash: ${deployData.transactionHash}`);
      if (this.context.selectedNetwork) {
        lines.push(`  Network: ${this.context.selectedNetwork.name}`);
      }
    }

    const aiData = this.findPreviousData('aiAudit');
    if (aiData) {
      lines.push('✓ AI Analysis: Completed');
    }

    lines.push('');
    lines.push(`Execution completed at: ${new Date().toLocaleString()}`);

    return lines.join('\n');
  }
}
