'use server';

import { explainFormula as explainFormulaFlow, ExplainFormulaInput, ExplainFormulaOutput } from '@/ai/flows/formula-explanation';

export async function explainFormula(input: ExplainFormulaInput): Promise<ExplainFormulaOutput> {
  // Here you could add extra validation, logging, or error handling
  try {
    const result = await explainFormulaFlow(input);
    return result;
  } catch (error) {
    console.error("Error in explainFormula action:", error);
    // It's better to throw a specific error or return an error object
    // For now, re-throwing but in a real app, you might want more graceful handling.
    throw new Error("Failed to get explanation from AI flow.");
  }
}
