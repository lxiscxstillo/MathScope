'use client';

import { useState, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { solveWithLagrange, LagrangeMultiplierOutput } from '@/ai/flows/lagrange-multiplier';
import { solveUnconstrained, UnconstrainedOptimizationOutput, CriticalPoint } from '@/ai/flows/unconstrained-optimization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDown, ArrowUp, BrainCircuit, Lightbulb, GitMerge, Mountain, Sun } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Schemas
const LagrangeSchema = z.object({
  objectiveFunc: z.string().min(1, 'La función objetivo es obligatoria.'),
  constraintFunc: z.string().min(1, 'La función de restricción es obligatoria.'),
});

const UnconstrainedSchema = z.object({
  objectiveFunc: z.string().min(1, 'La función objetivo es obligatoria.'),
});

// Tipos
type LagrangeFormValues = z.infer<typeof LagrangeSchema>;
type UnconstrainedFormValues = z.infer<typeof UnconstrainedSchema>;

// Renderer de Markdown
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
          const match = /language-(\w+)/.exec(className || '');
          if (inline) {
            return <InlineMath math={String(children)} />;
          }
          if (match) {
            return <div className="my-2"><BlockMath math={String(children).replace(/\n$/, '')} /></div>;
          }
          return <div className="my-2"><BlockMath math={String(children).replace(/\n$/, '')} /></div>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}


// Componente para Optimización sin restricciones
function UnconstrainedOptimization() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UnconstrainedOptimizationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<UnconstrainedFormValues>({
    resolver: zodResolver(UnconstrainedSchema),
    defaultValues: { objectiveFunc: '3*x^2 - x*y + 2*y^2 - 4*x - 7*y + 12' },
  });

  const onSubmit: SubmitHandler<UnconstrainedFormValues> = (data) => {
    startTransition(async () => {
      setError(null);
      setResult(null);

      try {
        const response = await solveUnconstrained(data);
        if (response && 'error' in response) {
          const errorMessage = (response as any).error || 'Ocurrió un error al resolver la optimización.';
          setError(errorMessage);
          toast({ variant: 'destructive', title: 'Error de Optimización', description: errorMessage });
          return;
        }
        setResult(response as UnconstrainedOptimizationOutput);
      } catch (e: any) {
        const errorMessage = e.message || 'Ocurrió un error al resolver. Revisa la función.';
        setError(errorMessage);
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      }
    });
  };
  
  const getPointIcon = (type: CriticalPoint['type']) => {
    switch (type) {
        case 'local-maximum': return <Sun className="mr-2 h-5 w-5 text-red-500" />;
        case 'local-minimum': return <Mountain className="mr-2 h-5 w-5 text-green-600" />;
        case 'saddle-point': return <GitMerge className="mr-2 h-5 w-5 text-yellow-500" />;
        default: return <Lightbulb className="mr-2 h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="objectiveFunc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Función Objetivo f(x, y)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: x^2 + y^2" className="font-code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Calculando...' : 'Encontrar Puntos Críticos'}
          </Button>
        </form>
      </Form>
      
      {isPending && ( <SkeletonCard /> )}
      {error && !isPending && <ErrorCard error={error} />}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Puntos Críticos Encontrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.criticalPoints.length > 0 ? result.criticalPoints.map((p, i) => (
                <div key={i}>
                    <h4 className="flex items-center font-medium">
                        {getPointIcon(p.type)}
                        {p.type.replace('-', ' ')}
                    </h4>
                    <p className="font-code text-sm pl-7 flex items-center gap-2">
                        f = {p.value.toFixed(4)} en <InlineMath math={p.point} />
                    </p>
                </div>
            )) : <p className="text-sm text-muted-foreground">No se encontraron puntos críticos.</p>}

            {result.calculationSteps && (
                <Accordion type="single" collapsible className="w-full pt-4" defaultValue="item-1">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary" /><span>Pasos del Cálculo (IA)</span></div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="h-96 w-full rounded-md border p-4">
                                <div className="prose prose-sm max-w-none text-foreground"><MarkdownRenderer content={result.calculationSteps} /></div>
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


// Componente para Lagrange
function LagrangeOptimization() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<LagrangeMultiplierOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<LagrangeFormValues>({
    resolver: zodResolver(LagrangeSchema),
    defaultValues: { objectiveFunc: 'x*y', constraintFunc: 'x^2 + y^2 - 1' },
  });

  const onSubmit: SubmitHandler<LagrangeFormValues> = (data) => {
    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const response = await solveWithLagrange(data);
        if (response && 'error' in response) {
          const errorMessage = (response as any).error || 'Ocurrió un error al resolver con Lagrange.';
          setError(errorMessage);
          toast({ variant: 'destructive', title: 'Error de Optimización', description: errorMessage });
          return;
        }
        setResult(response as LagrangeMultiplierOutput);
      } catch (e: any) {
        const errorMessage = e.message || 'Ocurrió un error al resolver. Revisa las funciones.';
        setError(errorMessage);
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      }
    });
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="objectiveFunc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Función Objetivo f(x, y)</FormLabel>
                <FormControl><Input placeholder="Ej: x*y" className="font-code" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Ej: x^2 + y^2 - 1" className="font-code" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Calculando...' : 'Encontrar Puntos Óptimos'}
          </Button>
        </form>
      </Form>
      
      {isPending && <SkeletonCard />}
      {error && !isPending && <ErrorCard error={error} />}

      {result && (
        <Card>
          <CardHeader><CardTitle>Resultados de la Optimización</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {result.maxima.length > 0 && (
              <div>
                <h4 className="flex items-center font-medium text-green-600"><ArrowUp className="mr-2 h-5 w-5" />Máximo(s)</h4>
                {result.maxima.map((m, i) => (
                   <p key={i} className="font-code text-sm pl-7 flex items-center gap-2">
                    <span>f = {m.value.toFixed(4)} en </span><InlineMath math={m.point} />
                  </p>
                ))}
              </div>
            )}
            {result.minima.length > 0 && (
              <div>
                <h4 className="flex items-center font-medium text-red-600"><ArrowDown className="mr-2 h-5 w-5" />Mínimo(s)</h4>
                {result.minima.map((m, i) => (
                  <p key={i} className="font-code text-sm pl-7 flex items-center gap-2">
                    <span>f = {m.value.toFixed(4)} en </span><InlineMath math={m.point} />
                  </p>
                ))}
              </div>
            )}
            {result.calculationSteps && (
                <Accordion type="single" collapsible className="w-full pt-4" defaultValue="item-1">
                    <AccordionItem value="item-1">
                        <AccordionTrigger><div className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary" /><span>Pasos del Cálculo (IA)</span></div></AccordionTrigger>
                        <AccordionContent>
                            <ScrollArea className="h-96 w-full rounded-md border p-4"><div className="prose prose-sm max-w-none text-foreground"><MarkdownRenderer content={result.calculationSteps} /></div></ScrollArea>
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


// Componentes auxiliares
const SkeletonCard = () => (
    <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="w-6 h-6 animate-pulse text-primary" />Analizando con IA...</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-4 w-3/4" /></div>
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-4 w-3/4" /></div>
            <Skeleton className="h-8 w-full mt-4" />
        </CardContent>
    </Card>
);

const ErrorCard = ({ error }: { error: string }) => (
    <Card className="border-destructive">
        <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
        <CardContent><p>{error}</p></CardContent>
    </Card>
);

// Componente principal
export function OptimizationSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimización de Funciones</CardTitle>
        <CardDescription>
          Encuentra puntos óptimos de una función con o sin restricciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="unconstrained" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unconstrained">Sin Restricciones</TabsTrigger>
            <TabsTrigger value="lagrange">Lagrange (Forzada)</TabsTrigger>
          </TabsList>
          <TabsContent value="unconstrained" className="pt-4">
            <UnconstrainedOptimization />
          </TabsContent>
          <TabsContent value="lagrange" className="pt-4">
            <LagrangeOptimization />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
