'use server';

/**
 * @fileOverview Resuelve integrales múltiples (dobles o triples) para una función dada.
 *
 * - calculateIntegral - Una función que toma una función, tipo de integral y límites, y devuelve el resultado y los pasos.
 * - IntegralInput - El tipo de entrada para la función calculateIntegral.
 * - IntegralOutput - El tipo de retorno para la función calculateIntegral.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const IntegralInputSchema = z.object({
  func: z.string().describe('La función a integrar, ej. "x^2*y".'),
  integralType: z.enum(['double', 'triple']).describe('El tipo de integral a calcular.'),
  limits: z.object({
    x_min: z.string().describe('Límite inferior de x.'),
    x_max: z.string().describe('Límite superior de x.'),
    y_min: z.string().describe('Límite inferior de y.'),
    y_max: z.string().describe('Límite superior de y.'),
    z_min: z.string().optional().describe('Límite inferior de z (para integrales triples).'),
    z_max: z.string().optional().describe('Límite superior de z (para integrales triples).'),
  }).describe('Los límites de integración.'),
});
export type IntegralInput = z.infer<typeof IntegralInputSchema>;

const IntegralOutputSchema = z.object({
  result: z.number().describe('El resultado numérico de la integral.'),
  calculationSteps: z.string().describe('Los pasos detallados del cálculo en formato Markdown con expresiones matemáticas en LaTeX (delimitadas por $ para inline y $$ para bloque).'),
});
export type IntegralOutput = z.infer<typeof IntegralOutputSchema>;

export async function calculateIntegral(input: IntegralInput): Promise<IntegralOutput> {
  return integralCalculationFlow(input);
}

const integralPrompt = ai.definePrompt({
  name: 'integralCalculationPrompt',
  input: { schema: IntegralInputSchema },
  output: { schema: IntegralOutputSchema },
  prompt: `Eres un experto matemático. Tu tarea es resolver una integral múltiple.

Función a integrar: f(x, y, z) = {{{func}}}
Tipo de Integral: {{{integralType}}}
Límites de Integración:
- x de {{{limits.x_min}}} a {{{limits.x_max}}}
- y de {{{limits.y_min}}} a {{{limits.y_max}}}
{{#if limits.z_min}}- z de {{{limits.z_min}}} a {{{limits.z_max}}}{{/if}}

Pasos a seguir:
1.  Plantea la integral definida con los límites proporcionados. Para una integral doble, será ∫(de y_min a y_max) ∫(de x_min a x_max) f(x,y) dx dy. Para una triple, añade la integral de z.
2.  Resuelve la integral paso a paso, mostrando la integración interna primero y luego las externas.
3.  Calcula el resultado numérico final.
4.  Formatea la salida en el JSON especificado. Los pasos detallados del cálculo deben estar en formato Markdown. **IMPORTANTE**: Todas las expresiones matemáticas, variables y ecuaciones deben estar en formato LaTeX. Usa '$' para matemáticas inline (ej. $f(x)=x^2$) y '$$' para ecuaciones en bloque (ej. $$\\int f(x)dx$$).

Si la integral es muy compleja o no se puede resolver analíticamente, indica que se usará un método numérico para la aproximación.
`,
});

const integralCalculationFlow = ai.defineFlow(
  {
    name: 'integralCalculationFlow',
    inputSchema: IntegralInputSchema,
    outputSchema: IntegralOutputSchema,
  },
  async (input) => {
    const { output } = await integralPrompt(input);
    if (!output) {
      throw new Error('La IA no pudo resolver la integral.');
    }
    return output;
  }
);
