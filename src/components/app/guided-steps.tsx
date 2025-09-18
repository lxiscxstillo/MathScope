'use client';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    title: '1. Función Original',
    formula: 'f(x, y) = \\sin(x) \\cos(y)',
    explanation: 'Esta es la función que queremos analizar.',
  },
  {
    title: '2. Derivar con respecto a x',
    formula: '\\frac{\\partial f}{\\partial x} = \\frac{\\partial}{\\partial x} (\\sin(x) \\cos(y))',
    explanation: 'Tratamos a "y" como una constante y aplicamos la regla de derivación para sin(x).',
  },
  {
    title: 'Resultado para ∂f/∂x',
    formula: '\\frac{\\partial f}{\\partial x} = \\cos(x) \\cos(y)',
    explanation: 'La derivada de sin(x) es cos(x).',
  },
  {
    title: '3. Derivar con respecto a y',
    formula: '\\frac{\\partial f}{\\partial y} = \\frac{\\partial}{\\partial y} (\\sin(x) \\cos(y))',
    explanation: 'Ahora tratamos a "x" como una constante y derivamos cos(y).',
  },
  {
    title: 'Resultado para ∂f/∂y',
    formula: '\\frac{\\partial f}{\\partial y} = -\\sin(x) \\sin(y)',
    explanation: 'La derivada de cos(y) es -sin(y).',
  },
  {
    title: '4. Construir el Vector Gradiente',
    formula: '\\nabla f = \\left[ \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y} \\right]',
    explanation: 'El gradiente es un vector de las derivadas parciales.',
  },
  {
    title: 'Gradiente Final',
    formula: '\\nabla f = [\\cos(x)\\cos(y), -\\sin(x)\\sin(y)]',
    explanation: 'Este vector apunta en la dirección de máximo crecimiento de la función en cualquier punto (x, y).',
  },
];

export function GuidedSteps() {
  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg">Derivación Paso a Paso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="p-4 bg-background rounded-lg shadow-sm">
              <h4 className="font-semibold text-primary mb-2">{step.title}</h4>
              <div className="my-4 text-center">
                <BlockMath math={step.formula} />
              </div>
              <p className="text-sm text-muted-foreground">{step.explanation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
