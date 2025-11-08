'use client';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as math from 'mathjs';
import debounce from 'lodash.debounce';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAppState } from '@/hooks/use-app-state';
import { InlineMath } from 'react-katex';

type AnalysisResult = {
  domain: string;
  range: string;
  firstDerivative: string;
  secondDerivative: string;
};

const FormSchema = z.object({
  func: z.string().min(1, 'La función es obligatoria.'),
});

export function FunctionInputSection() {
  const { state, dispatch } = useAppState();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      func: state.func,
    },
  });

  const analyzeFunction = useCallback((funcStr: string) => {
    if (!funcStr) {
      setIsValid(null);
      setAnalysisResult(null);
      return;
    }
    try {
      const compiledFunc = math.parse(funcStr).compile();
      compiledFunc.evaluate({ x: 1 });
      setIsValid(true);
      
      // Estimate range
      let minVal = Infinity;
      let maxVal = -Infinity;
      const step = 0.1;
      const domainRange = 100;
      for (let x = -domainRange; x <= domainRange; x += step) {
        try {
          const y = compiledFunc.evaluate({ x });
          if (isFinite(y)) {
            if (y < minVal) minVal = y;
            if (y > maxVal) maxVal = y;
          }
        } catch (e) {
          // Ignore points where function is not defined
        }
      }

      const firstDerivative = math.derivative(funcStr, 'x');
      const secondDerivative = math.derivative(firstDerivative, 'x');
      
      let rangeStr = 'No se pudo estimar';
      if (isFinite(minVal) && isFinite(maxVal)) {
        rangeStr = `Estimado: [${minVal.toFixed(2)}, ${maxVal.toFixed(2)}]`;
      }


      setAnalysisResult({
        domain: '(-∞, ∞)',
        range: rangeStr,
        firstDerivative: firstDerivative.toTex(),
        secondDerivative: secondDerivative.toTex(),
      });
      dispatch({ type: 'SET_FUNCTION', payload: funcStr });
    } catch (error) {
      setIsValid(false);
      setAnalysisResult(null);
    }
  }, [dispatch]);
  
  useEffect(() => {
    form.setValue('func', state.func);
    analyzeFunction(state.func);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.func]);
  
  const debouncedAnalyze = useCallback(debounce(analyzeFunction, 300), [analyzeFunction]);

  const handleFunctionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('func', value);
    debouncedAnalyze(value);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Función 1D</CardTitle>
          <CardDescription>Introduce una función f(x) para visualizar y analizar automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <FormField
                control={form.control}
                name="func"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>f(x) =</FormLabel>
                      {isValid !== null && (
                        <Badge variant={isValid ? 'default' : 'destructive'} className={isValid ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                          {isValid ? 'Válida' : 'Inválida'}
                        </Badge>
                      )}
                    </div>
                    <FormControl>
                      <Input placeholder="Ej: sin(x^2)" {...field} onChange={handleFunctionChange} className="font-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Dominio y Rango (Estimado)</AccordionTrigger>
                  <AccordionContent className="font-code text-sm space-y-2">
                    {analysisResult ? (
                      <>
                        <p>Dominio X: {analysisResult.domain}</p>
                        <p>Rango Y: {analysisResult.range}</p>
                      </>
                    ) : (
                       <p className="text-xs text-muted-foreground">Esperando función válida...</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Derivadas</AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                     {analysisResult ? (
                      <div className="font-code space-y-3">
                        <p className='flex items-center gap-2'><span>f'(x) =</span> <InlineMath math={analysisResult.firstDerivative} /></p>
                        <p className='flex items-center gap-2'><span>f''(x) =</span> <InlineMath math={analysisResult.secondDerivative} /></p>
                      </div>
                    ) : (
                       <p className="text-xs text-muted-foreground">Esperando función válida...</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
