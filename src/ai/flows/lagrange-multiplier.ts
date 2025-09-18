'use server';

/**
 * @fileOverview Resuelve problemas de optimización con restricciones usando Multiplicadores de Lagrange.
 *
 * - solveWithLagrange - Una función que toma una función objetivo y una restricción, y devuelve los puntos óptimos.
 * - LagrangeMultiplierInput - El tipo de entrada para la función solveWithLagrange.
 * - LagrangeMultiplierOutput - El tipo de retorno para la función solveWithLagrange.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PointSchema = z.object({
  point: z.string().describe('Las coordenadas del punto óptimo, ej. (x, y) o (x, y, z).'),
  value: z.number().describe('El valor de la función objetivo en ese punto.'),
});

const LagrangeMultiplierInputSchema = z.object({
  objectiveFunc: z.string().describe('La función objetivo a optimizar, ej. "x*y".'),
  constraintFunc: z.string().describe('La función de restricción igualada a cero, ej. "x^2 + y^2 - 1".'),
});
export type LagrangeMultiplierInput = z.infer<typeof LagrangeMultiplierInputSchema>;

const LagrangeMultiplierOutputSchema = z.object({
  maxima: z.array(PointSchema).describe('Una lista de puntos donde la función alcanza un máximo.'),
  minima: z.array(PointSchema).describe('Una lista de puntos donde la función alcanza un mínimo.'),
  calculationSteps: z.string().describe('Los pasos detallados del cálculo en formato Markdown.'),
});
export type LagrangeMultiplierOutput = z.infer<typeof LagrangeMultiplierOutputSchema>;

export async function solveWithLagrange(input: LagrangeMultiplierInput): Promise<LagrangeMultiplierOutput> {
  return lagrangeMultiplierFlow(input);
}

const lagrangePrompt = ai.definePrompt({
  name: 'lagrangeMultiplierPrompt',
  input: { schema: LagrangeMultiplierInputSchema },
  output: { schema: LagrangeMultiplierOutputSchema },
  prompt: `Eres un experto matemático especializado en cálculo multivariable y optimización. Tu tarea es resolver un problema de optimización con restricciones usando el método de los multiplicadores de Lagrange.

Función Objetivo: f(x, y) = {{{objectiveFunc}}}
Restricción: g(x, y) = {{{constraintFunc}}} = 0

Pasos a seguir:
1. Define la función Lagrangiana: L(x, y, λ) = f(x, y) - λ * g(x, y).
2. Calcula el gradiente de L: ∇L = [∂L/∂x, ∂L/∂y, ∂L/∂λ].
3. Iguala el gradiente a cero para obtener el sistema de ecuaciones:
   - ∂L/∂x = 0
   - ∂L/∂y = 0
   - ∂L/∂λ = 0  (que es la restricción original)
4. Resuelve el sistema de ecuaciones para encontrar los puntos críticos (x, y) y el valor de λ.
5. Evalúa la función objetivo f(x, y) en cada punto crítico para determinar si es un máximo o un mínimo.
6. Formatea la salida en el JSON especificado, incluyendo los pasos detallados del cálculo en formato Markdown. Asegúrate de que los arrays 'maxima' y 'minima' contengan todos los puntos encontrados.
`,
});

const lagrangeMultiplierFlow = ai.defineFlow(
  {
    name: 'lagrangeMultiplierFlow',
    inputSchema: LagrangeMultiplierInputSchema,
    outputSchema: LagrangeMultiplierOutputSchema,
  },
  async (input) => {
    const { output } = await lagrangePrompt(input);
    if (!output) {
      throw new Error('La IA no pudo resolver el problema de optimización.');
    }
    return output;
  }
);
