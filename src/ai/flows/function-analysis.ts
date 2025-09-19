'use server';

/**
 * @fileOverview Analiza una función de una variable f(x) para calcular sus derivadas y dominio.
 *
 * - analyzeFunction - Una función que toma una expresión de función y devuelve su análisis.
 * - FunctionAnalysisInput - El tipo de entrada para la función analyzeFunction.
 * - FunctionAnalysisOutput - El tipo de retorno para la función analyzeFunction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FunctionAnalysisInputSchema = z.object({
  func: z.string().describe('La función de una variable a analizar, ej. "x^2".'),
});
export type FunctionAnalysisInput = z.infer<typeof FunctionAnalysisInputSchema>;

const FunctionAnalysisOutputSchema = z.object({
  domain: z.string().describe('El dominio de la variable x en formato de intervalo, ej. "(-∞, ∞)".'),
  range: z.string().describe('El rango estimado de la función en formato de intervalo, ej. "[-1, 1]".'),
  firstDerivative: z.string().describe('La primera derivada con respecto a x, en formato LaTeX.'),
  secondDerivative: z.string().describe('La segunda derivada con respecto a x, en formato LaTeX.'),
  calculationSteps: z.string().describe('Los pasos detallados del cálculo de las derivadas en formato Markdown con expresiones matemáticas en LaTeX.'),
});
export type FunctionAnalysisOutput = z.infer<typeof FunctionAnalysisOutputSchema>;

export async function analyzeFunction(input: FunctionAnalysisInput): Promise<FunctionAnalysisOutput> {
  return functionAnalysisFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'functionAnalysisPrompt',
  input: { schema: FunctionAnalysisInputSchema },
  output: { schema: FunctionAnalysisOutputSchema },
  prompt: `Eres un experto matemático. Tu tarea es analizar la siguiente función de una variable: f(x) = {{{func}}}

Pasos a seguir:
1.  **Dominio**: Determina el dominio para la variable 'x'. Si no hay restricciones (como divisiones por cero, raíces de números negativos, etc.), el dominio es (-∞, ∞).
2.  **Rango**: Estima el rango de la función. Puede ser un análisis simple basado en las funciones componentes (ej. sin, cos tienen rango [-1, 1]).
3.  **Derivadas**:
    a. Calcula la primera derivada f'(x).
    b. Calcula la segunda derivada f''(x).
4.  **Pasos de Cálculo**: Detalla el proceso para obtener las derivadas. Explica qué reglas de derivación usaste (regla de la cadena, del producto, etc.).
5.  **Formato de Salida**: Formatea toda la salida en el JSON especificado. **IMPORTANTE**: Todas las expresiones matemáticas (derivadas, etc.) deben estar en formato LaTeX. Los pasos del cálculo deben estar en formato Markdown, usando '$' para matemáticas inline y '$$' para bloques. **Para el campo 'calculationSteps', asegúrate de que las líneas de texto no excedan los 80 caracteres de ancho, insertando saltos de línea (\\n) para que el texto se ajuste y sea legible.**

Ejemplo de Salida para f(x) = x^3:
- firstDerivative: "3x^2"
- secondDerivative: "6x"
- etc.
`,
});

const functionAnalysisFlow = ai.defineFlow(
  {
    name: 'functionAnalysisFlow',
    inputSchema: FunctionAnalysisInputSchema,
    outputSchema: FunctionAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error('La IA no pudo analizar la función.');
    }
    return output;
  }
);
