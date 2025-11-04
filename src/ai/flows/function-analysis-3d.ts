'use server';

/**
 * @fileOverview Analiza una función de dos variables z = f(x, y) para calcular sus derivadas parciales y dominio.
 *
 * - analyzeFunction3D - Una función que toma una expresión de función 3D y devuelve su análisis.
 * - FunctionAnalysis3DInput - El tipo de entrada para la función analyzeFunction3D.
 * - FunctionAnalysis3DOutput - El tipo de retorno para la función analyzeFunction3D.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FunctionAnalysis3DInputSchema = z.object({
  func: z.string().describe('La función de dos variables a analizar, ej. "x^2 + y^2".'),
});
export type FunctionAnalysis3DInput = z.infer<typeof FunctionAnalysis3DInputSchema>;

const FunctionAnalysis3DOutputSchema = z.object({
  domain: z.string().describe('El dominio de las variables x e y en formato de intervalo, ej. "x: (-∞, ∞), y: (-∞, ∞)".'),
  range: z.string().describe('El rango estimado de la función z en formato de intervalo, ej. "[-1, 1]".'),
  firstPartialX: z.string().describe('La primera derivada parcial con respecto a x (∂z/∂x), en formato LaTeX.'),
  firstPartialY: z.string().describe('La primera derivada parcial con respecto a y (∂z/∂y), en formato LaTeX.'),
  secondPartialX: z.string().describe('La segunda derivada parcial con respecto a x (∂²z/∂x²), en formato LaTeX.'),
  secondPartialY: z.string().describe('La segunda derivada parcial con respecto a y (∂²z/∂y²), en formato LaTeX.'),
});
export type FunctionAnalysis3DOutput = z.infer<typeof FunctionAnalysis3DOutputSchema>;

export async function analyzeFunction3D(input: FunctionAnalysis3DInput): Promise<FunctionAnalysis3DOutput> {
    const result = await functionAnalysis3DFlow(input);
    if ('error' in result) {
        throw new Error(result.error);
    }
    return result;
}

const analysisPrompt = ai.definePrompt({
  name: 'functionAnalysis3DPrompt',
  input: { schema: FunctionAnalysis3DInputSchema },
  output: { schema: FunctionAnalysis3DOutputSchema },
  prompt: `Eres un experto matemático. Tu tarea es analizar la siguiente función de dos variables: z = f(x, y) = {{{func}}}

Pasos a seguir:
1.  **Dominio**: Determina el dominio para las variables 'x' e 'y'. Si no hay restricciones, el dominio para ambas es (-∞, ∞).
2.  **Rango**: Estima el rango de la función z.
3.  **Derivadas Parciales**:
    a. Calcula la primera derivada parcial con respecto a x (∂z/∂x).
    b. Calcula la primera derivada parcial con respecto a y (∂z/∂y).
    c. Calcula la segunda derivada parcial con respecto a x (∂²z/∂x²).
    d. Calcula la segunda derivada parcial con respecto a y (∂²z/∂y²).
4.  **Formato de Salida**: Formatea toda la salida en el JSON especificado. **IMPORTANTE**: Todas las expresiones matemáticas deben estar en formato LaTeX.
`,
});

const functionAnalysis3DFlow = ai.defineFlow(
  {
    name: 'functionAnalysis3DFlow',
    inputSchema: FunctionAnalysis3DInputSchema,
    outputSchema: z.union([FunctionAnalysis3DOutputSchema, z.object({ error: z.string() })]),
  },
  async (input) => {
    try {
      const { output } = await analysisPrompt(input);
      if (!output) {
        return { error: 'La IA no pudo analizar la función 3D.' };
      }
      return output;
    } catch (error) {
      console.error('Error en el flujo de análisis de función 3D:', error);
      return { error: 'El servicio de IA no está disponible o la solicitud ha fallado. Por favor, inténtalo de nuevo más tarde.' };
    }
  }
);
