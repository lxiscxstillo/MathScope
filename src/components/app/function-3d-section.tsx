'use client';
import { useState, useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as math from 'mathjs';
import debounce from 'lodash.debounce';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { convertNaturalTo3DFunction } from '@/ai/flows/natural-to-3d-function';
import { explainFormula } from '@/ai/flows/formula-explanation';
import { analyzeFunction3D, FunctionAnalysis3DOutput } from '@/ai/flows/function-analysis-3d';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, Lightbulb, Calculator } from 'lucide-react';


const FormSchema = z.object({
  func: z.string().min(1, 'La función es obligatoria.'),
});

// Componente para renderizar Markdown con soporte para LaTeX
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      components={{
        p: ({ node, ...props }) => <div className="mb-2" {...props} />,
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          if (inline) {
            return <InlineMath math={String(children)} />;
          }
          if (match) {
            return <BlockMath math={String(children).replace(/\n$/, '')} />;
          }
          return <div className="my-2"><BlockMath math={String(children).replace(/\n$/, '')} /></div>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

type Function3DSectionProps = {
  setFunc3D: (func: string) => void;
};

export function Function3DSection({ setFunc3D }: Function3DSectionProps) {
  const [isValid, setIsValid] = useState<boolean | null>(true);
  const [isAiPending, startAiTransition] = useTransition();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplanationPending, startExplanationTransition] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<FunctionAnalysis3DOutput | null>(null);
  const [isAnalysisPending, startAnalysisTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      func: 'sin(sqrt(x^2 + y^2)) / sqrt(x^2 + y^2)',
    },
    mode: 'onChange' // Validar en cada cambio
  });

  const validateFunction = (funcStr: string) => {
    if (!funcStr) {
      setIsValid(null);
      return;
    }
    try {
      const node = math.parse(funcStr);
      const compiled = node.compile();
      // Test with dummy values
      compiled.evaluate({ x: 1, y: 1 }); 
      setIsValid(true);
      // If valid, update the graph in real-time
      setFunc3D(funcStr);
    } catch (error) {
      setIsValid(false);
    }
  };

  const debouncedValidate = useCallback(debounce(validateFunction, 300), [setFunc3D]);

  const handleFunctionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('func', value, { shouldValidate: true });
    setAnalysisResult(null); // Reset analysis on function change
    debouncedValidate(value);
  };

  function onSubmitWithAI(data: z.infer<typeof FormSchema>) {
    setExplanation(null);
    setAnalysisResult(null);

    startAiTransition(async () => {
      const result = await convertNaturalTo3DFunction({ description: data.func });
      if (result && 'error' in result) {
        toast({
          title: 'Error de IA',
          description: (result as any).error || `No se pudo interpretar la descripción.`,
          variant: 'destructive'
        });
        if (isValid) {
          setFunc3D(data.func);
        }
        return;
      }
        
      if (result) {
        const aiFunc = result.func;
        
        form.setValue('func', aiFunc, { shouldValidate: true });
        validateFunction(aiFunc); // This will also call setFunc3D
        toast({
          title: 'Función Interpretada por IA',
          description: `Se ha graficado: z = ${aiFunc}`,
        });

        // Now, get the explanation for the generated function
        startExplanationTransition(async () => {
          const explanationResult = await explainFormula({ formula: aiFunc, language: 'Español' });
          if (explanationResult && 'error' in explanationResult) {
            toast({
              title: 'Error de Explicación (IA)',
              description: (explanationResult as any).error || "No se pudo generar una explicación para esta fórmula.",
              variant: 'destructive'
            });
          } else if (explanationResult) {
            setExplanation(explanationResult.explanation);
          }
        });
      }
    });
  }

  function handleAnalysis() {
    const func = form.getValues('func');
    if (!isValid || !func) {
        toast({
            title: 'Función no válida',
            description: 'Por favor, introduce una función matemática válida para analizar.',
            variant: 'destructive'
        });
        return;
    }
    
    startAnalysisTransition(async () => {
        setAnalysisResult(null);
        const result = await analyzeFunction3D({ func });
        if (result && 'error' in result) {
            toast({
                title: 'Error de Análisis',
                description: (result as any).error || 'La IA no pudo procesar el análisis de la función.',
                variant: 'destructive'
            });
        } else if (result) {
            setAnalysisResult(result);
        }
    });
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Función 3D</CardTitle>
        <CardDescription>Introduce una función `z = f(x, y)` o descríbela en lenguaje natural.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitWithAI)} className="space-y-4">
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
                    <Input placeholder="Ej: sin(x) * cos(y) o esfera de radio 2" {...field} onChange={handleFunctionChange} className="font-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={isAiPending || isExplanationPending}>
                {isAiPending || isExplanationPending ? (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4 animate-pulse" />
                    Interpretando...
                  </>
                ) : (
                  'Interpretar y Explicar con IA'
                )}
              </Button>
               <Button type="button" variant="secondary" onClick={handleAnalysis} className="w-full" disabled={isAnalysisPending || !isValid}>
                {isAnalysisPending ? (
                  <>
                    <Calculator className="mr-2 h-4 w-4 animate-pulse" />
                    Analizando...
                  </>
                ) : (
                  'Analizar Función'
                )}
              </Button>
            </div>
          </form>
        </Form>
        
        {(isExplanationPending || explanation) && (
          <Accordion type="single" collapsible className="w-full mt-4" defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                   <div className="flex items-center gap-2">
                     <Lightbulb className="w-5 h-5 text-primary" />
                     <span>Explicación de la Fórmula (IA)</span>
                   </div>
                </AccordionTrigger>
                <AccordionContent>
                  {isExplanationPending ? (
                     <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                  ): explanation && (
                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                        <div className="prose prose-sm max-w-none text-foreground">
                            <MarkdownRenderer content={explanation} />
                        </div>
                    </ScrollArea>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        )}

      </CardContent>
    </Card>

    {(isAnalysisPending || analysisResult) && (
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Análisis de la Función
            </CardTitle>
        </CardHeader>
        <CardContent>
             <Accordion type="single" collapsible className="w-full" defaultValue='item-1'>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Dominio y Rango (Estimado)</AccordionTrigger>
                  <AccordionContent className="font-code text-sm space-y-2">
                    {isAnalysisPending ? (
                      <>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-2/4" />
                      </>
                    ) : analysisResult ? (
                      <>
                        <p>Dominio: {analysisResult.domain}</p>
                        <p>Rango Z: {analysisResult.range}</p>
                      </>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Derivadas Parciales</AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                     {isAnalysisPending ? (
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : analysisResult ? (
                      <div className="font-code space-y-3">
                        <p className='flex items-center gap-2'><span>∂z/∂x =</span> <InlineMath math={analysisResult.firstPartialX} /></p>
                        <p className='flex items-center gap-2'><span>∂z/∂y =</span> <InlineMath math={analysisResult.firstPartialY} /></p>
                        <p className='flex items-center gap-2'><span>∂²z/∂x² =</span> <InlineMath math={analysisResult.secondPartialX} /></p>
                        <p className='flex items-center gap-2'><span>∂²z/∂y² =</span> <InlineMath math={analysisResult.secondPartialY} /></p>
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
        </CardContent>
      </Card>
    )}
    </div>
  );
}
