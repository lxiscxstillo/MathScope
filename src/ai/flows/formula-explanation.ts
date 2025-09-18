'use server';

/**
 * @fileOverview Explica fórmulas matemáticas de forma sencilla, aceptando lenguaje natural.
 *
 * - explainFormula - Una función que toma una fórmula y devuelve su explicación.
 * - ExplainFormulaInput - El tipo de entrada para la función explainFormula.
 * - ExplainFormulaOutput - El tipo de retorno para la función explainFormula.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainFormulaInputSchema = z.object({
  formula: z.string().describe('La fórmula matemática a explicar (en lenguaje natural o LaTeX).'),
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

// Prompt para convertir la fórmula de lenguaje natural a LaTeX
const latexConversionPrompt = ai.definePrompt({
  name: 'latexConversionPrompt',
  input: {schema: z.object({ formula: z.string() })},
  output: {schema: z.object({ latex: z.string() })},
  prompt: `Convierte la siguiente fórmula matemática a formato LaTeX. Responde solo con la fórmula en LaTeX, sin ninguna explicación adicional.

Ejemplo 1:
Entrada: e^(i*pi) + 1 = 0
Salida: e^{i\\pi} + 1 = 0

Ejemplo 2:
Entrada: f(x) = sum(1/n^2, n=1, inf)
Salida: f(x) = \\sum_{n=1}^{\\infty} \\frac{1}{n^2}

Fórmula a convertir:
Entrada: {{{formula}}}
Salida:`,
});

// Prompt para explicar la fórmula (ya en LaTeX)
const formulaExplanationPrompt = ai.definePrompt({
  name: 'formulaExplanationPrompt',
  input: {schema: z.object({
    latex: z.string(),
    language: z.string(),
  })},
  output: {schema: ExplainFormulaOutputSchema},
  prompt: `Eres un asistente experto que explica fórmulas matemáticas de manera clara y fácil de entender.

Proporciona una explicación de la siguiente fórmula en el idioma del usuario. La fórmula está en formato LaTeX.
Fórmula: {{{latex}}}
Idioma: {{{language}}}
Explicación:`,
});

// Flujo principal que orquesta la conversión y la explicación
const explainFormulaFlow = ai.defineFlow(
  {
    name: 'explainFormulaFlow',
    inputSchema: ExplainFormulaInputSchema,
    outputSchema: ExplainFormulaOutputSchema,
  },
  async input => {
    // 1. Convertir la fórmula de entrada a LaTeX
    const conversionResult = await latexConversionPrompt({ formula: input.formula });
    const latexFormula = conversionResult.output?.latex;

    if (!latexFormula) {
      throw new Error("No se pudo convertir la fórmula a LaTeX.");
    }
    
    // 2. Explicar la fórmula LaTeX
    const {output} = await formulaExplanationPrompt({ 
      latex: latexFormula,
      language: input.language 
    });

    return output!;
  }
);
