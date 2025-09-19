'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { calculateIntegral, IntegralOutput } from '@/ai/flows/integral-calculation';
import { useAppState } from '@/hooks/use-app-state';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';


const FormSchema = z.object({
  integralType: z.enum(['double', 'triple']),
  limits: z.object({
    x_min: z.string().min(1, 'Requerido'),
    x_max: z.string().min(1, 'Requerido'),
    y_min: z.string().min(1, 'Requerido'),
    y_max: z.string().min(1, 'Requerido'),
    z_min: z.string().optional(),
    z_max: z.string().optional(),
  }),
}).refine(data => {
    if (data.integralType === 'triple') {
        return !!data.limits.z_min && !!data.limits.z_max;
    }
    return true;
}, {
    message: "Límites de Z son requeridos para integrales triples.",
    path: ['limits', 'z_min'],
});

type FormValues = z.infer<typeof FormSchema>;

// Componente para renderizar Markdown con soporte para LaTeX
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      components={{
        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
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

export function IntegrationSection() {
  const { state: appState } = useAppState();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<IntegralOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      integralType: 'double',
      limits: {
        x_min: '-2',
        x_max: '2',
        y_min: '-2',
        y_max: '2',
        z_min: '0',
        z_max: '1',
      },
    },
  });
  
  const integralType = form.watch('integralType');

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const response = await calculateIntegral({
            func: appState.func,
            ...data
        });
        setResult(response);
      } catch (e) {
        setError('Ocurrió un error al calcular la integral. Revisa la función y los límites.');
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Integración Múltiple</CardTitle>
        <CardDescription>
          Calcula integrales dobles y triples para la función activa.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="integralType"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Integral</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo de integral" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="double">Integral Doble (Volumen)</SelectItem>
                                <SelectItem value="triple">Integral Triple (Hipervolumen)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />

                <div className="space-y-4">
                <h4 className="font-medium">Límites de Integración</h4>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="limits.x_min" render={({field}) => (<FormItem><FormLabel>x-mín</FormLabel><FormControl><Input {...field} className="font-code"/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="limits.x_max" render={({field}) => (<FormItem><FormLabel>x-máx</FormLabel><FormControl><Input {...field} className="font-code"/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="limits.y_min" render={({field}) => (<FormItem><FormLabel>y-mín</FormLabel><FormControl><Input {...field} className="font-code"/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="limits.y_max" render={({field}) => (<FormItem><FormLabel>y-máx</FormLabel><FormControl><Input {...field} className="font-code"/></FormControl><FormMessage /></FormItem>)} />
                    {integralType === 'triple' && (
                        <>
                            <FormField control={form.control} name="limits.z_min" render={({field}) => (<FormItem><FormLabel>z-mín</FormLabel><FormControl><Input {...field} className="font-code"/></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="limits.z_max" render={({field}) => (<FormItem><FormLabel>z-máx</FormLabel><FormControl><Input {...field} className="font-code"/></FormControl><FormMessage /></FormItem>)} />
                        </>
                    )}
                </div>
                </div>

                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? 'Calculando...' : 'Calcular Integral'}
                </Button>
            </form>
          </Form>
      </CardContent>
    </Card>

    {isPending && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6 animate-pulse text-primary" />
                    Calculando con IA...
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
    )}

    {error && (
        <Card className="border-destructive">
            <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
            <CardContent><p>{error}</p></CardContent>
        </Card>
    )}

    {result && (
        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary" />
                    Resultado de la Integral
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-3xl font-bold font-code text-center text-primary">{result.result.toFixed(4)}</p>
                    <p className="text-center text-muted-foreground text-sm mt-1">
                        {integralType === 'double' ? 'Volumen bajo la superficie' : 'Hipervolumen calculado'}
                    </p>
                </div>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="steps">
                    <AccordionTrigger className="text-sm">Ver Pasos del Cálculo</AccordionTrigger>
                    <AccordionContent>
                        <ScrollArea className="h-96 w-full rounded-md border">
                            <div className="prose prose-sm max-w-none p-4 text-foreground">
                                <MarkdownRenderer content={result.calculationSteps} />
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    )}
    </div>
  );
}
