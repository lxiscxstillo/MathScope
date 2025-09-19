'use server';

/**
 * @fileOverview Convierte descripciones de lenguaje natural a fórmulas matemáticas 3D.
 *
 * - convertNaturalTo3DFunction - Convierte lenguaje natural a una fórmula z = f(x, y).
 * - NaturalTo3DFunctionInput - El tipo de entrada.
 * - NaturalTo3DFunctionOutput - El tipo de salida.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const NaturalTo3DFunctionInputSchema = z.object({
  description: z.string().describe('La descripción en lenguaje natural de una superficie 3D.'),
});
export type NaturalTo3DFunctionInput = z.infer<typeof NaturalTo3DFunctionInputSchema>;

const NaturalTo3DFunctionOutputSchema = z.object({
  func: z.string().describe('La fórmula matemática resultante en formato z = f(x, y).'),
});
export type NaturalTo3DFunctionOutput = z.infer<typeof NaturalTo3DFunctionOutputSchema>;

export async function convertNaturalTo3DFunction(input: NaturalTo3DFunctionInput): Promise<NaturalTo3DFunctionOutput> {
  return naturalTo3DFunctionFlow(input);
}

const conversionPrompt = ai.definePrompt({
  name: 'naturalTo3DFunctionPrompt',
  input: { schema: NaturalTo3DFunctionInputSchema },
  output: { schema: NaturalTo3DFunctionOutputSchema },
  prompt: `Eres un experto matemático. Tu tarea es convertir una descripción en lenguaje natural de una superficie o forma 3D a su correspondiente fórmula matemática explícita en la forma z = f(x, y).

Reglas:
1.  La salida debe ser una expresión que pueda ser evaluada directamente por una calculadora gráfica como math.js.
2.  La función debe ser en términos de 'x' e 'y'.
3.  Si la descripción es una forma cerrada (como una esfera), proporciona la fórmula para el hemisferio superior (z >= 0).
4.  Si la descripción ya es una fórmula matemática válida, simplemente devuélvela sin cambios.
5.  Responde únicamente con el campo 'func' en el JSON de salida.

Ejemplos:
- Entrada: "un paraboloide"
  Salida: { "func": "x^2 + y^2" }
- Entrada: "una esfera de radio 5"
  Salida: { "func": "sqrt(25 - x^2 - y^2)" }
- Entrada: "el plano z = 3"
  Salida: { "func": "3" }
- Entrada: "cono"
  Salida: { "func": "sqrt(x^2 + y^2)" }
- Entrada: "sin(x) * cos(y)"
  Salida: { "func": "sin(x) * cos(y)" }
- Entrada: "silla de montar"
  Salida: { "func": "x^2 - y^2" }

Descripción del usuario:
{{{description}}}
`,
});

const naturalTo3DFunctionFlow = ai.defineFlow(
  {
    name: 'naturalTo3DFunctionFlow',
    inputSchema: NaturalTo3DFunctionInputSchema,
    outputSchema: NaturalTo3DFunctionOutputSchema,
  },
  async (input) => {
    const { output } = await conversionPrompt(input);
    if (!output) {
      throw new Error('La IA no pudo convertir la descripción a una fórmula.');
    }
    return output;
  }
);
