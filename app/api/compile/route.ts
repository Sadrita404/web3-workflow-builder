import { NextRequest, NextResponse } from 'next/server';
import solc from 'solc';

export const maxDuration = 60; // Maximum execution time in seconds

interface CompileRequest {
  sourceCode: string;
  contractName: string;
  compilerVersion?: string;
}

interface CompilationResult {
  success: boolean;
  abi?: any[];
  bytecode?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * POST /api/compile
 * Compiles Solidity source code and returns ABI and bytecode
 */
export async function POST(request: NextRequest) {
  try {
    const body: CompileRequest = await request.json();
    const { sourceCode, contractName, compilerVersion = '0.8.20' } = body;

    // Validate inputs
    if (!sourceCode || !contractName) {
      return NextResponse.json(
        {
          success: false,
          errors: ['Source code and contract name are required'],
        },
        { status: 400 }
      );
    }

    // Prepare the input for the Solidity compiler
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: sourceCode,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    };

    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter((error: any) => error.severity === 'error');
      const warnings = output.errors.filter((error: any) => error.severity === 'warning');

      if (errors.length > 0) {
        const result: CompilationResult = {
          success: false,
          errors: errors.map((e: any) => e.formattedMessage),
          warnings: warnings.map((w: any) => w.formattedMessage),
        };
        return NextResponse.json(result, { status: 200 });
      }

      // Only warnings, continue
      if (warnings.length > 0) {
        console.warn('Compilation warnings:', warnings);
      }
    }

    // Extract the compiled contract
    const contracts = output.contracts['contract.sol'];

    if (!contracts || Object.keys(contracts).length === 0) {
      const result: CompilationResult = {
        success: false,
        errors: ['No contracts found in the compiled output.'],
      };
      return NextResponse.json(result, { status: 200 });
    }

    // Try to find the requested contract, or use the first available one
    let contract = contracts[contractName];
    let actualContractName = contractName;

    if (!contract) {
      // Contract name doesn't match, try to find the main contract
      const availableContracts = Object.keys(contracts);

      // Filter out interfaces and libraries, prefer actual contracts
      const mainContracts = availableContracts.filter(name => {
        // Check if it's not an interface or library (heuristic)
        const contractDef = contracts[name];
        return contractDef && contractDef.abi && contractDef.abi.length > 0;
      });

      if (mainContracts.length > 0) {
        // Use the first main contract found
        actualContractName = mainContracts[0];
        contract = contracts[actualContractName];
        console.log(`Contract name mismatch: requested '${contractName}', using '${actualContractName}'`);
      } else {
        // No suitable contract found
        const result: CompilationResult = {
          success: false,
          errors: [
            `Contract '${contractName}' not found in compiled output.`,
            `Available contracts: ${availableContracts.join(', ')}`,
          ],
        };
        return NextResponse.json(result, { status: 200 });
      }
    }

    const result: CompilationResult = {
      success: true,
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
      warnings: output.errors
        ?.filter((e: any) => e.severity === 'warning')
        .map((w: any) => w.formattedMessage),
    };

    // Add a note if we used a different contract name
    if (actualContractName !== contractName) {
      result.warnings = result.warnings || [];
      result.warnings.unshift(
        `Note: Using contract '${actualContractName}' (requested '${contractName}' was not found)`
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Compilation error:', error);

    const result: CompilationResult = {
      success: false,
      errors: [error.message || 'Unknown compilation error occurred'],
    };

    return NextResponse.json(result, { status: 500 });
  }
}

/**
 * GET /api/compile
 * Returns API information
 */
export async function GET() {
  return NextResponse.json({
    message: 'Solidity Compilation API',
    version: '1.0.0',
    compilerVersion: solc.version(),
    endpoint: 'POST /api/compile',
    requiredFields: {
      sourceCode: 'string - Solidity source code',
      contractName: 'string - Name of the contract to compile',
      compilerVersion: 'string (optional) - Solidity version (currently ignored, using default)',
    },
    example: {
      sourceCode: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract MyContract {\n  uint256 public value = 42;\n}',
      contractName: 'MyContract',
    },
  });
}
