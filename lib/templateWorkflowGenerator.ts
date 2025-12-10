import { Node, Edge } from '@xyflow/react';
import { nodeConfigs } from '@/types/nodes';
import { ContractTemplate } from './contractTemplates';
import { ethers } from 'ethers';

/**
 * Generate a complete workflow from a contract template
 * Creates all necessary nodes and connects them
 */
export function generateWorkflowFromTemplate(
  template: ContractTemplate
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const baseY = 100;
  const spacing = 120;
  let currentY = baseY;

  // 1. Project Create Node
  const projectNode: Node = {
    id: `project-${Date.now()}`,
    type: 'custom',
    position: { x: 400, y: currentY },
    data: {
      label: nodeConfigs.projectCreate.label,
      type: 'projectCreate',
      icon: nodeConfigs.projectCreate.icon,
      status: 'idle',
      projectTitle: `${template.name} Project`,
      projectDescription: template.description,
    },
  };
  nodes.push(projectNode);
  currentY += spacing;

  // 2. Contract Input Node (with template code)
  const contractNode: Node = {
    id: `contract-${Date.now()}`,
    type: 'custom',
    position: { x: 400, y: currentY },
    data: {
      label: nodeConfigs.contractInput.label,
      type: 'contractInput',
      icon: nodeConfigs.contractInput.icon,
      status: 'idle',
      contractCode: template.code,
      contractName: extractContractName(template.code),
    },
  };
  nodes.push(contractNode);
  edges.push({
    id: `${projectNode.id}-${contractNode.id}`,
    source: projectNode.id,
    target: contractNode.id,
    animated: true,
  });
  currentY += spacing;

  // 3. Compile Node
  const compileNode: Node = {
    id: `compile-${Date.now()}`,
    type: 'custom',
    position: { x: 400, y: currentY },
    data: {
      label: nodeConfigs.compile.label,
      type: 'compile',
      icon: nodeConfigs.compile.icon,
      status: 'idle',
      compilerVersion: '0.8.20',
    },
  };
  nodes.push(compileNode);
  edges.push({
    id: `${contractNode.id}-${compileNode.id}`,
    source: contractNode.id,
    target: compileNode.id,
    animated: true,
  });
  currentY += spacing;

  // 4. Generate ABI Node (left side)
  const abiNode: Node = {
    id: `abi-${Date.now()}`,
    type: 'custom',
    position: { x: 250, y: currentY },
    data: {
      label: nodeConfigs.generateABI.label,
      type: 'generateABI',
      icon: nodeConfigs.generateABI.icon,
      status: 'idle',
    },
  };
  nodes.push(abiNode);
  edges.push({
    id: `${compileNode.id}-${abiNode.id}`,
    source: compileNode.id,
    target: abiNode.id,
    animated: true,
  });

  // 5. Generate Bytecode Node (right side)
  const bytecodeNode: Node = {
    id: `bytecode-${Date.now()}`,
    type: 'custom',
    position: { x: 550, y: currentY },
    data: {
      label: nodeConfigs.generateBytecode.label,
      type: 'generateBytecode',
      icon: nodeConfigs.generateBytecode.icon,
      status: 'idle',
    },
  };
  nodes.push(bytecodeNode);
  edges.push({
    id: `${compileNode.id}-${bytecodeNode.id}`,
    source: compileNode.id,
    target: bytecodeNode.id,
    animated: true,
  });
  currentY += spacing;

  // 6. Deploy Node (center, below ABI and Bytecode)
  // Generate default constructor arguments based on the template
  const defaultConstructorArgs = getDefaultConstructorArgs(template);

  const deployNode: Node = {
    id: `deploy-${Date.now()}`,
    type: 'custom',
    position: { x: 400, y: currentY },
    data: {
      label: nodeConfigs.deploy.label,
      type: 'deploy',
      icon: nodeConfigs.deploy.icon,
      status: 'idle',
      constructorArgs: defaultConstructorArgs,
      // Also store string representations for the dynamic form
      constructorArgsValues: defaultConstructorArgs.map(arg =>
        typeof arg === 'string' ? arg : String(arg)
      ),
    },
  };
  nodes.push(deployNode);
  edges.push({
    id: `${abiNode.id}-${deployNode.id}`,
    source: abiNode.id,
    target: deployNode.id,
    animated: true,
  });
  edges.push({
    id: `${bytecodeNode.id}-${deployNode.id}`,
    source: bytecodeNode.id,
    target: deployNode.id,
    animated: true,
  });
  currentY += spacing;

  // 7. Completion Node
  const completionNode: Node = {
    id: `completion-${Date.now()}`,
    type: 'custom',
    position: { x: 400, y: currentY },
    data: {
      label: nodeConfigs.completion.label,
      type: 'completion',
      icon: nodeConfigs.completion.icon,
      status: 'idle',
    },
  };
  nodes.push(completionNode);
  edges.push({
    id: `${deployNode.id}-${completionNode.id}`,
    source: deployNode.id,
    target: completionNode.id,
    animated: true,
  });

  return { nodes, edges };
}

/**
 * Generate a workflow with AI audit node
 */
export function generateWorkflowWithAI(
  template: ContractTemplate
): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges } = generateWorkflowFromTemplate(template);

  // Find the contract input node
  const contractNode = nodes.find((n) => n.data.type === 'contractInput');
  const compileNode = nodes.find((n) => n.data.type === 'compile');

  if (contractNode && compileNode) {
    // Insert AI Audit node between contract and compile
    const aiNode: Node = {
      id: `ai-${Date.now()}`,
      type: 'custom',
      position: {
        x: contractNode.position.x + 200,
        y: contractNode.position.y + 60,
      },
      data: {
        label: nodeConfigs.aiAudit.label,
        type: 'aiAudit',
        icon: nodeConfigs.aiAudit.icon,
        status: 'idle',
        aiPrompt: 'Analyze this smart contract for security vulnerabilities and suggest improvements.',
      },
    };

    nodes.push(aiNode);

    // Add edge from contract to AI
    edges.push({
      id: `${contractNode.id}-${aiNode.id}`,
      source: contractNode.id,
      target: aiNode.id,
      animated: true,
    });
  }

  return { nodes, edges };
}

/**
 * Extract contract name from Solidity code
 */
function extractContractName(sourceCode: string): string {
  const match = sourceCode.match(/contract\s+(\w+)/);
  return match ? match[1] : 'MyContract';
}

/**
 * Get default constructor arguments based on template ID
 */
function getDefaultConstructorArgs(template: ContractTemplate): any[] {
  switch (template.id) {
    case 'simple-token':
      return ['MyToken', 'MTK', '1000000']; // name, symbol, initialSupply

    case 'simple-nft':
      return ['MyNFT', 'MNFT']; // name, symbol

    case 'crowdfunding':
      // title, description, goal, startAt, endAt
      const now = Math.floor(Date.now() / 1000);
      return [
        'My Campaign',
        'Description of my campaign',
        ethers.parseEther('10').toString(), // 10 ETH goal
        now.toString(),
        (now + 30 * 24 * 60 * 60).toString() // 30 days from now
      ];

    case 'multisig-wallet':
      // owners array, numConfirmationsRequired
      return [
        ['0x0000000000000000000000000000000000000001'], // placeholder owners
        '1'
      ];

    case 'voting':
      return []; // No constructor args

    case 'escrow':
      return []; // No constructor args

    case 'staking':
      // stakingToken, rewardToken addresses
      return [
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002'
      ];

    case 'airdrop':
      // token address
      return ['0x0000000000000000000000000000000000000001'];

    case 'nft-marketplace':
      return []; // No constructor args

    case 'lottery':
      // ticketPrice
      return [ethers.parseEther('0.01').toString()]; // 0.01 ETH per ticket

    default:
      return []; // Empty array for contracts with no constructor or unknown templates
  }
}
