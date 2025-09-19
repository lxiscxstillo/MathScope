'use client';

import { useState, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { solveWithLagrange, LagrangeMultiplierOutput } from '@/ai/flows/lagrange-multiplier';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDown, ArrowUp, BrainCircuit } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const FormSchema = z.object({
  objectiveFunc: z.string().min(1, 'La función objetivo es obligatoria.'),
  constraintFunc: z.string().min(1, 'La función de restricción es obligatoria.'),
});

type FormValues = z.infer<typeof FormSchema>;

// Componente para renderizar Markdown con soporte para LaTeX
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      components={{
        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
        h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-lg font-semibold my-3" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        code({ node, inline, className, children, ...props }) {
          if (inline) {
            return <InlineMath math={String(children)} />;
          }
          return <BlockMath math={String(children)} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}


export function OptimizationSection() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<LagrangeMultiplierOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      objectiveFunc: 'x*y',
      constraintFunc: 'x^2 + y^2 - 1',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const response = await solveWithLagrange(data);
        setResult(response);
      } catch (e) {
        setError('Ocurrió un error al resolver la optimización. Por favor, revisa las funciones e intenta de nuevo.');
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Optimización con Restricciones</CardTitle>
          <CardDescription>
            Encuentra puntos óptimos usando multiplicadores de Lagrange con IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="objectiveFunc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Función Objetivo f(x, y)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: x*y" className="font-code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="constraintFunc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restricción g(x, y) = 0</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: x^2 + y^2 - 1" className="font-code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Calculando...' : 'Encontrar Puntos Óptimos'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && <OptimizationSkeleton />}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="bg-secondary/50">
          <CardHeader>
            <CardTitle>Resultados de la Optimización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.maxima.length > 0 && (
              <div>
                <h4 className="flex items-center font-medium text-green-600">
                  <ArrowUp className="mr-2 h-5 w-5" />
                  Máximo(s)
                </h4>
                {result.maxima.map((m, i) => (
                   <p key={i} className="font-code text-sm pl-7 flex items-center gap-2">
                    <span>f = {m.value.toFixed(4)} en </span>
                    <InlineMath math={m.point} />
                  </p>
                ))}
              </div>
            )}
            {result.minima.length > 0 && (
              <div>
                <h4 className="flex items-center font-medium text-red-600">
                  <ArrowDown className="mr-2 h-5 w-5" />
                  Mínimo(s)
                </h4>
                {result.minima.map((m, i) => (
                  <p key={i} className="font-code text-sm pl-7 flex items-center gap-2">
                    <span>f = {m.value.toFixed(4)} en </span>
                    <InlineMath math={m.point} />
                  </p>
                ))}
              </div>
            )}
             {result.calculationSteps && (
               <Accordion type="single" collapsible className="w-full" defaultValue="steps">
                <AccordionItem value="steps">
                  <AccordionTrigger className="text-sm">
                    Ver Pasos del Cálculo
                  </AccordionTrigger>
                  <AccordionContent>
                      <ScrollArea className="h-72 w-full">
                        <div className="prose prose-sm max-w-none text-foreground p-2 bg-background rounded-md whitespace-pre-wrap">
                          <MarkdownRenderer content={result.calculationSteps} />
                        </div>
                      </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
             )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OptimizationSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 animate-pulse text-primary" />
          Analizando con IA...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}
