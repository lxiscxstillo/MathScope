'use server';

/**
 * @fileOverview Analiza una función de dos variables f(x, y) para calcular sus derivadas y dominio.
 *
 * - analyzeFunction - Una función que toma una expresión de función y devuelve su análisis.
 * - FunctionAnalysisInput - El tipo de entrada para la función analyzeFunction.
 * - FunctionAnalysisOutput - El tipo de retorno para la función analyzeFunction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FunctionAnalysisInputSchema = z.object({
  func: z.string().describe('La función de dos variables a analizar, ej. "x^2*y".'),
});
export type FunctionAnalysisInput = z.infer<typeof FunctionAnalysisInputSchema>;

const FunctionAnalysisOutputSchema = z.object({
  domain: z.object({
    x: z.string().describe('El dominio de la variable x en formato de intervalo, ej. "(-∞, ∞)".'),
    y: z.string().describe('El dominio de la variable y en formato de intervalo, ej. "(-∞, ∞)".'),
  }).describe('El dominio de la función.'),
  range: z.string().describe('El rango estimado de la función en formato de intervalo, ej. "[-1, 1]".'),
  partialDerivativeX: z.string().describe('La derivada parcial con respecto a x, en formato LaTeX.'),
  partialDerivativeY: z.string().describe('La derivada parcial con respecto a y, en formato LaTeX.'),
  gradient: z.string().describe('El vector gradiente, en formato LaTeX.'),
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
  prompt: `Eres un experto matemático. Tu tarea es analizar la siguiente función de dos variables: f(x, y) = {{{func}}}

Pasos a seguir:
1.  **Dominio**: Determina el dominio para las variables 'x' y 'y'. Si no hay restricciones (como divisiones por cero, raíces de números negativos, etc.), el dominio es (-∞, ∞).
2.  **Rango**: Estima el rango de la función. Puede ser un análisis simple basado en las funciones componentes (ej. sin, cos tienen rango [-1, 1]).
3.  **Derivadas Parciales**:
    a. Calcula la derivada parcial ∂f/∂x, tratando 'y' como una constante.
    b. Calcula la derivada parcial ∂f/∂y, tratando 'x' como una constante.
4.  **Gradiente**: Construye el vector gradiente ∇f = [∂f/∂x, ∂f/∂y].
5.  **Pasos de Cálculo**: Detalla el proceso para obtener las derivadas parciales. Explica qué reglas de derivación usaste.
6.  **Formato de Salida**: Formatea toda la salida en el JSON especificado. **IMPORTANTE**: Todas las expresiones matemáticas (derivadas, gradiente, etc.) deben estar en formato LaTeX. Los pasos del cálculo deben estar en formato Markdown, usando '$' para matemáticas inline y '$$' para bloques.

Ejemplo de Salida para f(x,y) = x^2 * y:
- partialDerivativeX: "2xy"
- partialDerivativeY: "x^2"
- gradient: "[2xy, x^2]"
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
