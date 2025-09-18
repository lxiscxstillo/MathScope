// FormulaExplanation flow
'use server';

/**
 * @fileOverview Explains mathematical formulas in a user-friendly way.
 *
 * - explainFormula - A function that takes a formula and returns its explanation.
 * - ExplainFormulaInput - The input type for the explainFormula function.
 * - ExplainFormulaOutput - The return type for the explainFormula function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainFormulaInputSchema = z.object({
  formula: z.string().describe('The mathematical formula to explain.'),
  language: z.string().describe('The language in which to provide the explanation.'),
});
export type ExplainFormulaInput = z.infer<typeof ExplainFormulaInputSchema>;

const ExplainFormulaOutputSchema = z.object({
  explanation: z.string().describe('A clear and easy-to-understand explanation of the formula.'),
});
export type ExplainFormulaOutput = z.infer<typeof ExplainFormulaOutputSchema>;

export async function explainFormula(input: ExplainFormulaInput): Promise<ExplainFormulaOutput> {
  return explainFormulaFlow(input);
}

const formulaExplanationPrompt = ai.definePrompt({
  name: 'formulaExplanationPrompt',
  input: {schema: ExplainFormulaInputSchema},
  output: {schema: ExplainFormulaOutputSchema},
  prompt: `You are a helpful assistant that explains mathematical formulas in a clear and easy-to-understand way.

  Provide an explanation of the following formula in the user's language:
  Formula: {{{formula}}}
  Language: {{{language}}}
  Explanation:`,
});

const explainFormulaFlow = ai.defineFlow(
  {
    name: 'explainFormulaFlow',
    inputSchema: ExplainFormulaInputSchema,
    outputSchema: ExplainFormulaOutputSchema,
  },
  async input => {
    const {output} = await formulaExplanationPrompt(input);
    return output!;
  }
);
