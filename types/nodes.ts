export type NodeType =
  | 'projectCreate'
  | 'contractInput'
  | 'compile'
  | 'generateABI'
  | 'generateBytecode'
  | 'deploy'
  | 'aiAudit'
  | 'completion';

export interface NodeData {
  [key: string]: any;
  label: string;
  type: NodeType;
  icon?: string;
  status?: 'idle' | 'running' | 'success' | 'error';

  // Project Create Node
  projectTitle?: string;
  projectDescription?: string;

  // Contract Input Node
  contractCode?: string;
  contractName?: string;

  // Compilation Node
  compilerVersion?: string;
  compilationResult?: any;

  // ABI Node
  abi?: any[];

  // Bytecode Node
  bytecode?: string;

  // Deploy Node
  deployedAddress?: string;
  transactionHash?: string;
  constructorArgs?: any[];
  constructorArgsValues?: string[]; // String values for the form inputs

  // AI Audit Node
  aiPrompt?: string;
  aiResponse?: string;

  // Completion Node
  summary?: string;

  // Common
  output?: any;
  error?: string;
}

export interface WorkflowNodeConfig {
  type: NodeType;
  label: string;
  icon: string;
  description: string;
  color: string;
  category: 'core' | 'contract' | 'analysis' | 'deployment';
}

export const nodeConfigs: Record<NodeType, WorkflowNodeConfig> = {
  projectCreate: {
    type: 'projectCreate',
    label: 'Create Project',
    icon: '📁',
    description: 'Initialize a new smart contract project',
    color: '#FF6B6B',
    category: 'core'
  },
  contractInput: {
    type: 'contractInput',
    label: 'Contract Input',
    icon: '📝',
    description: 'Add or upload Solidity contract code',
    color: '#4ECDC4',
    category: 'contract'
  },
  compile: {
    type: 'compile',
    label: 'Compile Contract',
    icon: '⚙️',
    description: 'Compile Solidity code using solc',
    color: '#FFE66D',
    category: 'contract'
  },
  generateABI: {
    type: 'generateABI',
    label: 'Generate ABI',
    icon: '📋',
    description: 'Extract contract ABI from compilation',
    color: '#95E1D3',
    category: 'contract'
  },
  generateBytecode: {
    type: 'generateBytecode',
    label: 'Generate Bytecode',
    icon: '🔢',
    description: 'Extract contract bytecode',
    color: '#F38181',
    category: 'contract'
  },
  deploy: {
    type: 'deploy',
    label: 'Deploy Contract',
    icon: '🚀',
    description: 'Deploy contract to blockchain',
    color: '#AA96DA',
    category: 'deployment'
  },
  aiAudit: {
    type: 'aiAudit',
    label: 'AI Audit',
    icon: '🤖',
    description: 'Analyze contract with OpenAI',
    color: '#FCBAD3',
    category: 'analysis'
  },
  completion: {
    type: 'completion',
    label: 'Workflow Complete',
    icon: '✅',
    description: 'Workflow execution summary',
    color: '#6BCF7F',
    category: 'core'
  }
};
