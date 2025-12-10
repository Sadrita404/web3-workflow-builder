import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge, Connection, addEdge } from '@xyflow/react';

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: Node[];
  edges: Edge[];
}

export interface Network {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  explorer?: string;
}

export interface NodeExecutionState {
  nodeId: string;
  status: 'idle' | 'running' | 'success' | 'error';
  output?: any;
  error?: string;
}

interface WorkflowState {
  // Project Management
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project | null) => void;
  createProject: (title: string, description: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Workflow Canvas
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: any) => void;

  // Network Management
  networks: Network[];
  selectedNetwork: Network | null;
  setSelectedNetwork: (network: Network) => void;
  addCustomNetwork: (network: Network) => void;

  // Execution State
  executionStates: NodeExecutionState[];
  isExecuting: boolean;
  setExecutionState: (nodeId: string, state: Omit<NodeExecutionState, 'nodeId'>) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  resetExecution: () => void;

  // UI State
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const defaultNetworks: Network[] = [
  {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    chainId: 1,
    symbol: 'ETH',
    explorer: 'https://etherscan.io'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com'
  },
  {
    id: 'bsc',
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56,
    symbol: 'BNB',
    explorer: 'https://bscscan.com'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    symbol: 'AVAX',
    explorer: 'https://snowtrace.io'
  },
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    chainId: 11155111,
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io'
  }
];

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
  // Project Management
  currentProject: null,
  projects: [],

  setCurrentProject: (project) => {
    set({
      currentProject: project,
      nodes: project?.nodes || [],
      edges: project?.edges || []
    });
  },

  createProject: (title, description) => {
    const newProject: Project = {
      id: Date.now().toString(),
      title,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: [],
      edges: []
    };
    set(state => ({
      projects: [...state.projects, newProject],
      currentProject: newProject,
      nodes: [],
      edges: []
    }));
  },

  updateProject: (id, updates) => {
    set(state => {
      const updatedProjects = state.projects.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      );
      return {
        projects: updatedProjects,
        currentProject: state.currentProject?.id === id
          ? { ...state.currentProject, ...updates, updatedAt: new Date() }
          : state.currentProject
      };
    });
  },

  deleteProject: (id) => {
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
      nodes: state.currentProject?.id === id ? [] : state.nodes,
      edges: state.currentProject?.id === id ? [] : state.edges
    }));
  },

  // Workflow Canvas
  nodes: [],
  edges: [],

  setNodes: (nodes) => {
    set({ nodes });
    const { currentProject } = get();
    if (currentProject) {
      get().updateProject(currentProject.id, { nodes });
    }
  },

  setEdges: (edges) => {
    set({ edges });
    const { currentProject } = get();
    if (currentProject) {
      get().updateProject(currentProject.id, { edges });
    }
  },

  onConnect: (connection) => {
    set(state => {
      const newEdges = addEdge({
        ...connection,
        type: 'animated',
        animated: true
      }, state.edges);
      if (state.currentProject) {
        get().updateProject(state.currentProject.id, { edges: newEdges });
      }
      return { edges: newEdges };
    });
  },

  addNode: (node) => {
    set(state => {
      const newNodes = [...state.nodes, node];
      if (state.currentProject) {
        get().updateProject(state.currentProject.id, { nodes: newNodes });
      }
      return { nodes: newNodes };
    });
  },

  removeNode: (nodeId) => {
    set(state => {
      const newNodes = state.nodes.filter(n => n.id !== nodeId);
      const newEdges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
      if (state.currentProject) {
        get().updateProject(state.currentProject.id, { nodes: newNodes, edges: newEdges });
      }
      return {
        nodes: newNodes,
        edges: newEdges,
        selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode
      };
    });
  },

  updateNode: (nodeId, data) => {
    set(state => {
      const newNodes = state.nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      );
      if (state.currentProject) {
        get().updateProject(state.currentProject.id, { nodes: newNodes });
      }
      return { nodes: newNodes };
    });
  },

  // Network Management
  networks: defaultNetworks,
  selectedNetwork: defaultNetworks[0],

  setSelectedNetwork: (network) => set({ selectedNetwork: network }),

  addCustomNetwork: (network) => {
    set(state => ({
      networks: [...state.networks, network]
    }));
  },

  // Execution State
  executionStates: [],
  isExecuting: false,

  setExecutionState: (nodeId, state) => {
    set(currentState => {
      const existingIndex = currentState.executionStates.findIndex(s => s.nodeId === nodeId);
      let newStates;

      if (existingIndex >= 0) {
        newStates = [...currentState.executionStates];
        newStates[existingIndex] = { nodeId, ...state };
      } else {
        newStates = [...currentState.executionStates, { nodeId, ...state }];
      }

      return { executionStates: newStates };
    });
  },

  setIsExecuting: (isExecuting) => set({ isExecuting }),

  resetExecution: () => set({ executionStates: [], isExecuting: false }),

  // UI State
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'workflow-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        projects: state.projects,
        currentProject: state.currentProject,
        networks: state.networks,
        selectedNetwork: state.selectedNetwork,
      }),
      skipHydration: true,
    }
  )
);
