'use client';
import { useEffect, useState, useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as math from 'mathjs';
import debounce from 'lodash.debounce';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/hooks/use-app-state';
import { useToast } from '@/hooks/use-toast';
import { analyzeFunction, FunctionAnalysisOutput } from '@/ai/flows/function-analysis';
import { Skeleton } from '../ui/skeleton';
import { BlockMath, InlineMath } from 'react-katex';
import { ScrollArea } from '../ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import { BrainCircuit, Lightbulb } from 'lucide-react';

const FormSchema = z.object({
  func: z.string().min(1, 'La función es obligatoria.'),
});

// Componente para renderizar Markdown con soporte para LaTeX
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      components={{
        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
        h3: ({ node, ...props }) => <h3 className="font-semibold text-primary mb-2" {...props} />,
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          if (inline) {
            return <InlineMath math={String(children)} />;
          }
          return <div className="my-4"><BlockMath math={String(children)} /></div>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}


export function FunctionInputSection() {
  const { state, dispatch } = useAppState();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<FunctionAnalysisOutput | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      func: state.func,
    },
  });
  
  useEffect(() => {
    form.setValue('func', state.func);
    validateFunction(state.func);
    setAnalysisResult(null);
    setAnalysisError(null);
    if(state.func) {
      onSubmit({func: state.func});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.func]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validateFunction = (funcStr: string) => {
    if (!funcStr) {
      setIsValid(null);
      return;
    }
    try {
      math.parse(funcStr).compile().evaluate({ x: 1 });
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
    }
  };

  const debouncedValidate = useCallback(debounce(validateFunction, 300), []);

  const handleFunctionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('func', value);
    debouncedValidate(value);
  };
  
  function onSubmit(data: z.infer<typeof FormSchema>) {
    dispatch({ type: 'SET_FUNCTION', payload: data.func });
    toast({
      title: 'Análisis Iniciado',
      description: `Analizando la función: ${data.func}`,
    });

    startTransition(async () => {
      setAnalysisResult(null);
      setAnalysisError(null);
      try {
        const result = await analyzeFunction({ func: data.func });
        setAnalysisResult(result);
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: result });
      } catch (error) {
        console.error(error);
        setAnalysisError('No se pudo analizar la función. Revisa la sintaxis.');
        toast({
          variant: 'destructive',
          title: 'Error de Análisis',
          description: 'La IA no pudo procesar la función.',
        });
      }
    });
  }

  const toggleGuidedMode = (checked: boolean) => {
    dispatch({ type: 'SET_GUIDED_MODE', payload: checked });
  };


  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Función 1D</CardTitle>
        <CardDescription>Introduce una función f(x) para visualizar y analizar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  {isPending ? (
                    <>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/4" />
                    </>
                  ) : analysisResult ? (
                    <>
                      <p>Dominio X: {analysisResult.domain}</p>
                      <p>Rango Y: {analysisResult.range}</p>
                    </>
                  ) : (
                     <p className="text-xs text-muted-foreground">Calcula para ver los resultados.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Derivadas</AccordionTrigger>
                <AccordionContent className="text-sm space-y-3">
                   {isPending ? (
                    <>
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </>
                  ) : analysisResult ? (
                    <div className="font-code space-y-3">
                      <p className='flex items-center gap-2'><span>f'(x) =</span> <InlineMath math={analysisResult.firstDerivative} /></p>
                      <p className='flex items-center gap-2'><span>f''(x) =</span> <InlineMath math={analysisResult.secondDerivative} /></p>
                    </div>
                  ) : (
                     <p className="text-xs text-muted-foreground">Calcula para ver los resultados.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex items-center space-x-2">
              <Switch id="guided-mode" checked={state.guidedMode} onCheckedChange={toggleGuidedMode} />
              <Label htmlFor="guided-mode">Modo de Cálculo Guiado</Label>
            </div>

            <Button type="submit" className="w-full" disabled={!isValid || isPending}>
              {isPending ? 'Calculando...' : 'Calcular y Graficar'}
            </Button>
            {analysisError && <p className="text-sm text-destructive text-center">{analysisError}</p>}
          </form>
        </Form>
      </CardContent>
    </Card>

    {(isPending || (analysisResult && state.guidedMode)) && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Explicación Detallada (IA)
            </CardTitle>
        </CardHeader>
        <CardContent>
           {isPending ? (
             <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
          ): analysisResult?.calculationSteps && (
            <ScrollArea className="h-96 w-full rounded-md border">
              <div className="p-4 whitespace-nowrap">
                <MarkdownRenderer content={analysisResult.calculationSteps} />
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    )}
    </div>
  );
}
