'use server';

/**
 * @fileOverview Explica fórmulas matemáticas de forma sencilla.
 *
 * - explainFormula - Una función que toma una fórmula y devuelve su explicación.
 * - ExplainFormulaInput - El tipo de entrada para la función explainFormula.
 * - ExplainFormulaOutput - El tipo de retorno para la función explainFormula.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainFormulaInputSchema = z.object({
  formula: z.string().describe('La fórmula matemática a explicar (en formato LaTeX).'),
  language: z.string().describe('El idioma en el que se debe proporcionar la explicación.'),
});
export type ExplainFormulaInput = z.infer<typeof ExplainFormulaInputSchema>;

const ExplainFormulaOutputSchema = z.object({
  explanation: z.string().describe('Una explicación clara y fácil de entender de la fórmula.'),
});
export type ExplainFormulaOutput = z.infer<typeof ExplainFormulaOutputSchema>;

export async function explainFormula(input: ExplainFormulaInput): Promise<ExplainFormulaOutput> {
  return explainFormulaFlow(input);
}

const formulaExplanationPrompt = ai.definePrompt({
  name: 'formulaExplanationPrompt',
  input: {schema: ExplainFormulaInputSchema},
  output: {schema: ExplainFormulaOutputSchema},
  prompt: `Eres un asistente experto que explica fórmulas matemáticas de manera clara y fácil de entender.

Proporciona una explicación de la siguiente fórmula en el idioma del usuario. La fórmula está en formato LaTeX.
Fórmula: {{{formula}}}
Idioma: {{{language}}}
Explicación:`,
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
