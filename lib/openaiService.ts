import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function initializeOpenAI(apiKey?: string) {
  const key = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!key) {
    throw new Error('OpenAI API key is not configured');
  }

  openaiClient = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true, // Note: In production, API calls should go through a backend
  });

  return openaiClient;
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    initializeOpenAI();
  }
  return openaiClient!;
}

export interface AIAnalysisResult {
  success: boolean;
  response?: string;
  error?: string;
}

export async function analyzeContract(
  contractCode: string,
  prompt: string = 'Analyze this smart contract for security vulnerabilities and suggest improvements.'
): Promise<AIAnalysisResult> {
  try {
    const client = getOpenAIClient();

    const systemPrompt = `You are an expert Solidity smart contract auditor and security researcher.
Your task is to analyze smart contracts for:
1. Security vulnerabilities (reentrancy, overflow/underflow, access control issues, etc.)
2. Gas optimization opportunities
3. Code quality and best practices
4. Logic errors and potential bugs
5. Compliance with standards (ERC20, ERC721, etc.)

Provide clear, actionable feedback with severity levels (Critical, High, Medium, Low) for any issues found.`;

    const userPrompt = `${prompt}

Contract Code:
\`\`\`solidity
${contractCode}
\`\`\``;

    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: 'No response from OpenAI',
      };
    }

    return {
      success: true,
      response: content,
    };
  } catch (error: any) {
    console.error('OpenAI analysis error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze contract with AI',
    };
  }
}

export async function explainContract(contractCode: string): Promise<AIAnalysisResult> {
  const prompt = `Explain this smart contract in simple terms. Describe:
1. What the contract does
2. Main functions and their purposes
3. Who can call each function
4. Any important state variables
5. Overall contract architecture`;

  return analyzeContract(contractCode, prompt);
}

export async function generateDocumentation(contractCode: string): Promise<AIAnalysisResult> {
  const prompt = `Generate comprehensive NatSpec documentation for this smart contract. Include:
1. Contract-level documentation
2. Function-level documentation with @param and @return tags
3. Event documentation
4. Any important notes or warnings`;

  return analyzeContract(contractCode, prompt);
}

export async function suggestTestCases(contractCode: string): Promise<AIAnalysisResult> {
  const prompt = `Suggest comprehensive test cases for this smart contract. Include:
1. Unit tests for each function
2. Integration tests
3. Edge cases and boundary conditions
4. Attack vectors to test
5. Example test code in JavaScript/TypeScript using Hardhat/Ethers.js`;

  return analyzeContract(contractCode, prompt);
}

export async function optimizeContract(contractCode: string): Promise<AIAnalysisResult> {
  const prompt = `Analyze this smart contract for gas optimization opportunities. Suggest:
1. Variables that can be packed
2. Functions that can be made external/pure/view
3. Loop optimizations
4. Storage vs memory optimizations
5. Other gas-saving techniques
Provide the optimized code with explanations.`;

  return analyzeContract(contractCode, prompt);
}

export async function checkCompliance(
  contractCode: string,
  standard: string = 'ERC20'
): Promise<AIAnalysisResult> {
  const prompt = `Check if this smart contract properly implements the ${standard} standard. Verify:
1. All required functions are present
2. Function signatures match the standard
3. Events are properly defined
4. Return values are correct
5. Any deviations or issues`;

  return analyzeContract(contractCode, prompt);
}

export function isOpenAIConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_OPENAI_API_KEY || openaiClient);
}
