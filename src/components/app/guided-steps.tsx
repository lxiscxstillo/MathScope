'use client';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    title: '1. Original Function',
    formula: 'f(x, y) = \\sin(x) \\cos(y)',
    explanation: 'This is the function we want to analyze.',
  },
  {
    title: '2. Differentiate with respect to x',
    formula: '\\frac{\\partial f}{\\partial x} = \\frac{\\partial}{\\partial x} (\\sin(x) \\cos(y))',
    explanation: 'We treat y as a constant and apply the derivative rule for sin(x).',
  },
  {
    title: 'Result for ∂f/∂x',
    formula: '\\frac{\\partial f}{\\partial x} = \\cos(x) \\cos(y)',
    explanation: 'The derivative of sin(x) is cos(x).',
  },
  {
    title: '3. Differentiate with respect to y',
    formula: '\\frac{\\partial f}{\\partial y} = \\frac{\\partial}{\\partial y} (\\sin(x) \\cos(y))',
    explanation: 'Now we treat x as a constant and differentiate cos(y).',
  },
  {
    title: 'Result for ∂f/∂y',
    formula: '\\frac{\\partial f}{\\partial y} = -\\sin(x) \\sin(y)',
    explanation: 'The derivative of cos(y) is -sin(y).',
  },
  {
    title: '4. Construct the Gradient Vector',
    formula: '\\nabla f = \\left[ \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y} \\right]',
    explanation: 'The gradient is a vector of the partial derivatives.',
  },
  {
    title: 'Final Gradient',
    formula: '\\nabla f = [\\cos(x)\\cos(y), -\\sin(x)\\sin(y)]',
    explanation: 'This vector points in the direction of the steepest ascent of the function at any point (x, y).',
  },
];

export function GuidedSteps() {
  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg">Step-by-Step Derivation</CardTitle>
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
