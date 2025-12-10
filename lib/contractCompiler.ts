/**
 * Production-Ready Contract Compiler
 * Uses backend API for compilation to avoid browser WebAssembly limitations
 */

export interface CompilationResult {
  success: boolean;
  abi?: any[];
  bytecode?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Compile a Solidity contract using the backend API
 *
 * @param sourceCode - The Solidity source code to compile
 * @param contractName - The name of the contract to compile
 * @param compilerVersion - The Solidity compiler version (optional)
 * @returns CompilationResult with ABI, bytecode, and any errors/warnings
 */
export async function compileContract(
  sourceCode: string,
  contractName: string,
  compilerVersion: string = '0.8.20'
): Promise<CompilationResult> {
  try {
    // Basic validation before sending to backend
    const validation = validateSolidityCode(sourceCode);
    if (!validation.valid) {
      return {
        success: false,
        errors: [validation.message || 'Invalid Solidity code'],
      };
    }

    // Call the backend compilation API
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceCode,
        contractName,
        compilerVersion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        errors: [errorData.errors?.[0] || `HTTP ${response.status}: ${response.statusText}`],
      };
    }

    const result: CompilationResult = await response.json();
    return result;

  } catch (error: any) {
    console.error('Compilation request failed:', error);
    return {
      success: false,
      errors: [
        'Failed to connect to compilation service',
        error.message || 'Unknown error occurred',
      ],
    };
  }
}

/**
 * Extract contract name from Solidity source code
 * Looks for the main contract definition
 */
export function extractContractName(sourceCode: string): string | null {
  // Try to find the main contract (not abstract or interface)
  const contractMatch = sourceCode.match(/contract\s+(\w+)(?:\s+is\s+|\s*\{)/);
  if (contractMatch) {
    return contractMatch[1];
  }

  // Fallback: find any contract definition
  const anyContractMatch = sourceCode.match(/(?:contract|interface|library)\s+(\w+)/);
  return anyContractMatch ? anyContractMatch[1] : null;
}

/**
 * Validate Solidity source code for basic correctness
 */
export function validateSolidityCode(sourceCode: string): {
  valid: boolean;
  message?: string;
} {
  if (!sourceCode || sourceCode.trim().length === 0) {
    return {
      valid: false,
      message: 'Source code is empty'
    };
  }

  if (!sourceCode.includes('pragma solidity')) {
    return {
      valid: false,
      message: 'Missing "pragma solidity" directive. Please specify Solidity version.'
    };
  }

  if (!sourceCode.match(/(?:contract|interface|library)\s+\w+/)) {
    return {
      valid: false,
      message: 'No contract, interface, or library definition found'
    };
  }

  return { valid: true };
}

/**
 * Check if the compilation API is available
 */
export async function checkCompilerAvailability(): Promise<{
  available: boolean;
  version?: string;
  message?: string;
}> {
  try {
    const response = await fetch('/api/compile', {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        version: data.compilerVersion,
        message: 'Compilation service is ready',
      };
    }

    return {
      available: false,
      message: 'Compilation service is not responding',
    };
  } catch (error) {
    return {
      available: false,
      message: 'Cannot reach compilation service',
    };
  }
}

/**
 * Batch compile multiple contracts
 * Useful for contracts with dependencies
 */
export async function batchCompileContracts(
  contracts: Array<{ sourceCode: string; contractName: string }>
): Promise<Map<string, CompilationResult>> {
  const results = new Map<string, CompilationResult>();

  for (const contract of contracts) {
    const result = await compileContract(
      contract.sourceCode,
      contract.contractName
    );
    results.set(contract.contractName, result);

    // If compilation fails, stop the batch
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Get Solidity version from pragma statement
 */
export function extractSolidityVersion(sourceCode: string): string | null {
  const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+[\^~]?([\d.]+)/);
  return pragmaMatch ? pragmaMatch[1] : null;
}

/**
 * Format compilation errors for user-friendly display
 */
export function formatCompilationErrors(errors: string[]): string {
  if (!errors || errors.length === 0) {
    return 'Unknown compilation error';
  }

  return errors
    .map((error, index) => {
      // Extract line numbers if present
      const lineMatch = error.match(/(\d+):(\d+):/);
      if (lineMatch) {
        return `Line ${lineMatch[1]}:${lineMatch[2]}\n${error}`;
      }
      return error;
    })
    .join('\n\n');
}

/**
 * Analyze bytecode size and provide warnings
 */
export function analyzeBytecodeSize(bytecode: string): {
  size: number;
  sizeKB: number;
  warning?: string;
} {
  // Remove 0x prefix if present
  const cleanBytecode = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  const sizeBytes = cleanBytecode.length / 2; // Each byte is 2 hex characters
  const sizeKB = sizeBytes / 1024;

  let warning: string | undefined;

  // Ethereum mainnet has a 24KB contract size limit
  if (sizeKB > 24) {
    warning = `Contract size (${sizeKB.toFixed(2)}KB) exceeds Ethereum's 24KB limit. Deployment will fail on mainnet.`;
  } else if (sizeKB > 20) {
    warning = `Contract size (${sizeKB.toFixed(2)}KB) is close to Ethereum's 24KB limit. Consider optimization.`;
  }

  return {
    size: sizeBytes,
    sizeKB: parseFloat(sizeKB.toFixed(2)),
    warning,
  };
}
