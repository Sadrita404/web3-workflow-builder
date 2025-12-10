import { ethers } from 'ethers';

export interface ConstructorParam {
  name: string;
  type: string;
  description?: string;
  placeholder?: string;
}

/**
 * Extract constructor parameters from contract ABI
 */
export function extractConstructorParams(abi: any[]): ConstructorParam[] {
  try {
    // Find the constructor in the ABI
    const constructor = abi.find(
      (item) => item.type === 'constructor'
    );

    if (!constructor || !constructor.inputs || constructor.inputs.length === 0) {
      return []; // No constructor or no parameters
    }

    // Map ABI inputs to our parameter format
    return constructor.inputs.map((input: any, index: number) => ({
      name: input.name || `param${index}`,
      type: input.type,
      description: getTypeDescription(input.type),
      placeholder: getPlaceholder(input.type, input.name),
    }));
  } catch (error) {
    console.error('Error extracting constructor params:', error);
    return [];
  }
}

/**
 * Get human-readable description for Solidity types
 */
function getTypeDescription(type: string): string {
  if (type === 'address') return 'Ethereum address (0x...)';
  if (type === 'uint256') return 'Number (unsigned integer)';
  if (type === 'uint8' || type === 'uint16' || type === 'uint32') return 'Number';
  if (type === 'string') return 'Text string';
  if (type === 'bool') return 'Boolean (true/false)';
  if (type === 'bytes' || type.startsWith('bytes')) return 'Hex bytes';
  if (type.endsWith('[]')) return `Array of ${type.replace('[]', '')}`;
  return type;
}

/**
 * Get placeholder value based on type and parameter name
 */
function getPlaceholder(type: string, name?: string): string {
  // Smart placeholders based on parameter name
  if (name) {
    const lowerName = name.toLowerCase();

    // Token-related
    if (lowerName.includes('name') && type === 'string') return 'MyToken';
    if (lowerName.includes('symbol') && type === 'string') return 'MTK';
    if (lowerName.includes('supply')) return '1000000';
    if (lowerName.includes('price')) return ethers.parseEther('0.01').toString();

    // Time-related
    if (lowerName.includes('timestamp') || lowerName.includes('time')) {
      return Math.floor(Date.now() / 1000).toString();
    }
    if (lowerName.includes('duration') && lowerName.includes('day')) return '30';
    if (lowerName.includes('duration') && lowerName.includes('hour')) return '24';

    // Address-related
    if (lowerName.includes('owner') || lowerName.includes('admin')) {
      return '0x0000000000000000000000000000000000000000';
    }
    if (lowerName.includes('token') && type === 'address') {
      return '0x0000000000000000000000000000000000000000';
    }

    // Numerical
    if (lowerName.includes('amount') || lowerName.includes('value')) {
      return '100';
    }
    if (lowerName.includes('percentage') || lowerName.includes('rate')) {
      return '10';
    }
  }

  // Default placeholders by type
  if (type === 'address') return '0x0000000000000000000000000000000000000000';
  if (type === 'uint256' || type.startsWith('uint')) return '0';
  if (type === 'string') return 'Enter text';
  if (type === 'bool') return 'true';
  if (type.endsWith('[]')) return '[]';
  if (type.startsWith('bytes')) return '0x';

  return '';
}

/**
 * Get default value for a parameter type
 */
export function getDefaultValue(type: string, name?: string): string {
  if (name) {
    const lowerName = name.toLowerCase();

    // Token defaults
    if (lowerName.includes('name') && type === 'string') return 'MyToken';
    if (lowerName.includes('symbol') && type === 'string') return 'MTK';
    if (lowerName.includes('supply')) return '1000000';

    // Time defaults
    if (lowerName.includes('timestamp') || lowerName.includes('startat')) {
      return Math.floor(Date.now() / 1000).toString();
    }
    if (lowerName.includes('endat') || lowerName.includes('deadline')) {
      return (Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60).toString(); // 30 days
    }

    // Ether amounts
    if (lowerName.includes('price') && type === 'uint256') {
      return ethers.parseEther('0.01').toString();
    }
    if (lowerName.includes('goal') && type === 'uint256') {
      return ethers.parseEther('10').toString();
    }
  }

  // Type-based defaults
  if (type === 'address') return '0x0000000000000000000000000000000000000000';
  if (type === 'uint256' || type.startsWith('uint')) return '0';
  if (type === 'string') return '';
  if (type === 'bool') return 'false';
  if (type.endsWith('[]')) return '[]';
  if (type.startsWith('bytes')) return '0x';

  return '';
}

/**
 * Validate constructor argument based on type
 */
export function validateConstructorArg(value: string, type: string): { valid: boolean; error?: string } {
  try {
    if (!value && type !== 'string') {
      return { valid: false, error: 'Value is required' };
    }

    if (type === 'address') {
      if (!ethers.isAddress(value)) {
        return { valid: false, error: 'Invalid Ethereum address' };
      }
    } else if (type.startsWith('uint') || type.startsWith('int')) {
      if (!/^\d+$/.test(value)) {
        return { valid: false, error: 'Must be a number' };
      }
      // Check if it's a valid BigInt
      BigInt(value);
    } else if (type === 'bool') {
      if (value !== 'true' && value !== 'false') {
        return { valid: false, error: 'Must be true or false' };
      }
    } else if (type.endsWith('[]')) {
      try {
        JSON.parse(value);
      } catch {
        return { valid: false, error: 'Must be valid JSON array' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid value format' };
  }
}

/**
 * Convert string values to proper types for contract deployment
 */
export function formatConstructorArgs(params: ConstructorParam[], values: string[]): any[] {
  return params.map((param, index) => {
    const value = values[index] || '';

    try {
      // Handle arrays
      if (param.type.endsWith('[]')) {
        const parsed = JSON.parse(value || '[]');
        // If it's an address array, return as-is
        if (param.type === 'address[]') {
          return parsed;
        }
        // If it's a uint array, convert to strings
        if (param.type.startsWith('uint') || param.type.startsWith('int')) {
          return parsed.map((v: any) => String(v));
        }
        return parsed;
      }

      // Handle booleans
      if (param.type === 'bool') {
        return value === 'true';
      }

      // Handle addresses - return as-is (ethers will validate)
      if (param.type === 'address') {
        return value;
      }

      // Handle bytes
      if (param.type.startsWith('bytes')) {
        return value.startsWith('0x') ? value : `0x${value}`;
      }

      // Handle strings
      if (param.type === 'string') {
        return value;
      }

      // Handle numbers - ethers v6 accepts strings or numbers
      // For large numbers, strings are safer
      if (param.type.startsWith('uint') || param.type.startsWith('int')) {
        // Return as string to avoid precision loss
        return value || '0';
      }

      return value;
    } catch (error) {
      console.error(`Error formatting arg ${param.name}:`, error);
      return value;
    }
  });
}
