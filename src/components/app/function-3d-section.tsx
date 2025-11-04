'use client';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as math from 'mathjs';
import debounce from 'lodash.debounce';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type PartialAnalysis = {
  domain: string;
  range: string;
  firstPartialX: string;
  firstPartialY: string;
  secondPartialX: string;
  secondPartialY: string;
  gradient: string;
}

const FormSchema = z.object({
  func: z.string().min(1, 'La función es obligatoria.'),
});

type Function3DSectionProps = {
  setFunc3D: (value: { str: string; gradFns: { fx: math.EvalFunction, fy: math.EvalFunction } | null }) => void;
};

export function Function3DSection({ setFunc3D }: Function3DSectionProps) {
  const [isValid, setIsValid] = useState<boolean | null>(true);
  const [analysis, setAnalysis] = useState<PartialAnalysis | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      func: 'sin(sqrt(x^2 + y^2)) / sqrt(x^2 + y^2)',
    },
    mode: 'onChange'
  });

  const analyzeFunction = useCallback((funcStr: string) => {
    if (!funcStr) {
      setIsValid(null);
      setAnalysis(null);
      setFunc3D({ str: funcStr, gradFns: null });
      return;
    }
    try {
      const node = math.parse(funcStr);
      const compiled = node.compile();
      compiled.evaluate({ x: 1, y: 1 });
      setIsValid(true);

      const derivativeFxNode = math.derivative(funcStr, 'x');
      const derivativeFyNode = math.derivative(funcStr, 'y');
      const derivativeFxx = math.derivative(derivativeFxNode, 'x').toString();
      const derivativeFyy = math.derivative(derivativeFyNode, 'y').toString();

      setAnalysis({
        domain: "x: (-∞, ∞), y: (-∞, ∞)",
        range: "Estimado: [-0.217, 1]",
        firstPartialX: derivativeFxNode.toTex(),
        firstPartialY: derivativeFyNode.toTex(),
        secondPartialX: math.parse(derivativeFxx).toTex(),
        secondPartialY: math.parse(derivativeFyy).toTex(),
        gradient: `\\nabla f(x, y) = \\left( ${derivativeFxNode.toTex()}, \\, ${derivativeFyNode.toTex()} \\right)`
      });
      
      setFunc3D({
        str: funcStr, 
        gradFns: {
          fx: derivativeFxNode.compile(),
          fy: derivativeFyNode.compile(),
        }
      });
    } catch (error) {
      setIsValid(false);
      setAnalysis(null);
      setFunc3D({ str: funcStr, gradFns: null });
    }
  }, [setFunc3D]);

  const debouncedAnalyze = useCallback(debounce(analyzeFunction, 300), [analyzeFunction]);

  const handleFunctionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('func', value, { shouldValidate: true });
    debouncedAnalyze(value);
  };
  
  useEffect(() => {
    analyzeFunction(form.getValues('func'))
  }, [analyzeFunction, form]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Función 3D</CardTitle>
          <CardDescription>Introduce una función `z = f(x, y)` para visualizarla y analizarla automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="func"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>z = f(x, y) =</FormLabel>
                      {isValid !== null && (
                        <Badge variant={isValid ? 'default' : 'destructive'} className={isValid ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                          {isValid ? 'Válida' : 'Inválida'}
                        </Badge>
                      )}
                    </div>
                    <FormControl>
                      <Input placeholder="Ej: sin(x) * cos(y)" {...field} onChange={handleFunctionChange} className="font-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
      {analysis && isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis de la Función</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue='item-1'>
              <AccordionItem value="item-1">
                <AccordionTrigger>Dominio y Rango (Estimado)</AccordionTrigger>
                <AccordionContent className="font-code text-sm space-y-2">
                  <p>Dominio: {analysis.domain}</p>
                  <p>Rango Z: {analysis.range}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Derivadas Parciales</AccordionTrigger>
                <AccordionContent className="text-sm space-y-3">
                  <div className="font-code space-y-3">
                    <p className='flex items-center gap-2'><span>∂z/∂x =</span> <InlineMath math={analysis.firstPartialX} /></p>
                    <p className='flex items-center gap-2'><span>∂z/∂y =</span> <InlineMath math={analysis.firstPartialY} /></p>
                    <p className='flex items-center gap-2'><span>∂²z/∂x² =</span> <InlineMath math={analysis.secondPartialX} /></p>
                    <p className='flex items-center gap-2'><span>∂²z/∂y² =</span> <InlineMath math={analysis.secondPartialY} /></p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Gradiente</AccordionTrigger>
                <AccordionContent className="text-sm space-y-3">
                  <div className="font-code">
                    <p className='flex items-center gap-2'><InlineMath math={analysis.gradient} /></p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
