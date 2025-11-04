'use client';

import { useState, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as math from 'mathjs';

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
import { Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  func: z.string().min(1, 'La función es obligatoria.'),
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

export function IntegrationSection() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      func: 'x^2 * y',
      integralType: 'double',
      limits: {
        x_min: '0',
        x_max: '1',
        y_min: '0',
        y_max: '2',
        z_min: '0',
        z_max: '1',
      },
    },
  });
  
  const integralType = form.watch('integralType');

  // Basic numerical integration (Simpson's rule)
  const integrate = (fn: (x: number) => number, a: number, b: number, n: number = 100) => {
    const h = (b - a) / n;
    let sum = fn(a) + fn(b);
    for (let i = 1; i < n; i += 2) {
      sum += 4 * fn(a + i * h);
    }
    for (let i = 2; i < n - 1; i += 2) {
      sum += 2 * fn(a + i * h);
    }
    return (sum * h) / 3;
  };

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(() => {
      setError(null);
      setResult(null);
      
      try {
        const fn = math.parse(data.func).compile();
        
        const x_min = parseFloat(data.limits.x_min);
        const x_max = parseFloat(data.limits.x_max);
        const y_min = parseFloat(data.limits.y_min);
        const y_max = parseFloat(data.limits.y_max);
        
        if ([x_min, x_max, y_min, y_max].some(isNaN)) {
          throw new Error("Los límites deben ser números válidos.");
        }

        let integralResult: number;

        if (data.integralType === 'double') {
          const innerIntegral = (y: number) => integrate(x => fn.evaluate({ x, y }), x_min, x_max);
          integralResult = integrate(innerIntegral, y_min, y_max);
        } else { // Triple integral
          const z_min = parseFloat(data.limits.z_min || '0');
          const z_max = parseFloat(data.limits.z_max || '0');
          if ([z_min, z_max].some(isNaN)) {
            throw new Error("Los límites de Z deben ser números válidos.");
          }
          const innerMostIntegral = (y:number, z:number) => integrate(x => fn.evaluate({x, y, z}), x_min, x_max);
          const middleIntegral = (z: number) => integrate(y => innerMostIntegral(y, z), y_min, y_max);
          integralResult = integrate(middleIntegral, z_min, z_max);
        }

        setResult(integralResult);
      } catch (e: any) {
        const errorMessage = e.message || 'Error al calcular. Revisa la función y los límites.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error de Cálculo',
          description: errorMessage,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Integración Múltiple (Numérica)</CardTitle>
        <CardDescription>
          Calcula integrales dobles y triples usando métodos numéricos.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="func"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Función f(x, y, z)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: x^2 + y^2" className="font-code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                <CardTitle>Calculando...</CardTitle>
            </CardHeader>
        </Card>
    )}

    {error && !isPending && (
        <Card className="border-destructive">
            <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
            <CardContent><p>{error}</p></CardContent>
        </Card>
    )}

    {result !== null && (
        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary" />
                    Resultado (Aproximado)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-3xl font-bold font-code text-center text-primary">{result.toFixed(4)}</p>
                    <p className="text-center text-muted-foreground text-sm mt-1">
                        {integralType === 'double' ? 'Volumen bajo la superficie' : 'Hipervolumen calculado'}
                    </p>
                </div>
            </CardContent>
        </Card>
    )}
    </div>
  );
}
