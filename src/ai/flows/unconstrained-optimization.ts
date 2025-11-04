'use server';

/**
 * @fileOverview Resuelve problemas de optimización sin restricciones para encontrar puntos críticos.
 *
 * - solveUnconstrained - Una función que toma una función objetivo y devuelve los puntos críticos.
 * - UnconstrainedOptimizationInput - El tipo de entrada para la función solveUnconstrained.
 * - UnconstrainedOptimizationOutput - El tipo de retorno para la función solveUnconstrained.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CriticalPointSchema = z.object({
  point: z.string().describe('Las coordenadas del punto crítico en formato LaTeX, ej. "(0, 0)".'),
  value: z.number().describe('El valor de la función objetivo en ese punto.'),
  type: z.enum(['local-maximum', 'local-minimum', 'saddle-point', 'inconclusive']).describe('La clasificación del punto crítico.'),
});
export type CriticalPoint = z.infer<typeof CriticalPointSchema>;


const UnconstrainedOptimizationInputSchema = z.object({
  objectiveFunc: z.string().describe('La función objetivo a optimizar, ej. "x^2 + y^2".'),
});
export type UnconstrainedOptimizationInput = z.infer<typeof UnconstrainedOptimizationInputSchema>;

const UnconstrainedOptimizationOutputSchema = z.object({
  criticalPoints: z.array(CriticalPointSchema).describe('Una lista de todos los puntos críticos encontrados y su clasificación.'),
  calculationSteps: z.string().describe('Los pasos detallados del cálculo en formato Markdown con expresiones matemáticas en LaTeX (delimitadas por $ para inline y $$ para bloque).'),
});
export type UnconstrainedOptimizationOutput = z.infer<typeof UnconstrainedOptimizationOutputSchema>;

export async function solveUnconstrained(input: UnconstrainedOptimizationInput): Promise<UnconstrainedOptimizationOutput | { error: string }> {
  const result = await unconstrainedOptimizationFlow(input);
  return result;
}

const unconstrainedPrompt = ai.definePrompt({
  name: 'unconstrainedOptimizationPrompt',
  input: { schema: UnconstrainedOptimizationInputSchema },
  output: { schema: UnconstrainedOptimizationOutputSchema },
  prompt: `Eres un experto matemático. Tu tarea es encontrar y clasificar los puntos críticos de una función de dos variables f(x, y) usando el criterio de la segunda derivada.

Función Objetivo: f(x, y) = {{{objectiveFunc}}}

Pasos a seguir:
1.  Calcula las primeras derivadas parciales: f_x(x, y) y f_y(x, y).
2.  Encuentra los puntos críticos resolviendo el sistema de ecuaciones f_x = 0 y f_y = 0.
3.  Calcula las segundas derivadas parciales: f_xx(x, y), f_yy(x, y), y f_xy(x, y).
4.  Calcula el discriminante (o determinante Hessiano): D(x, y) = f_xx * f_yy - (f_xy)^2.
5.  Para cada punto crítico (a, b):
    a. Evalúa D(a, b) y f_xx(a, b).
    b. Clasifica el punto como máximo local, mínimo local, punto de silla, o si el criterio no es concluyente.
6.  Formatea la salida en el JSON especificado. Los pasos detallados del cálculo deben estar en formato Markdown. **IMPORTANTE**: Todas las expresiones matemáticas, variables y ecuaciones deben estar en formato LaTeX. Usa '$' para matemáticas inline y '$$' para ecuaciones en bloque. Las coordenadas de los puntos también deben estar en formato LaTeX.
`,
});

const unconstrainedOptimizationFlow = ai.defineFlow(
  {
    name: 'unconstrainedOptimizationFlow',
    inputSchema: UnconstrainedOptimizationInputSchema,
    outputSchema: z.union([UnconstrainedOptimizationOutputSchema, z.object({ error: z.string() })]),
  },
  async (input) => {
    try {
      const { output } = await unconstrainedPrompt(input);
      if (!output) {
        return { error: 'La IA no pudo resolver el problema de optimización.' };
      }
      return output;
    } catch (error) {
      console.error('Error en el flujo de optimización sin restricciones:', error);
      return { error: 'El servicio de IA no está disponible o la solicitud ha fallado. Por favor, inténtalo de nuevo más tarde.' };
    }
  }
);
