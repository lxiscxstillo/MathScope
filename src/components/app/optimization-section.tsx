'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as math from 'mathjs';
import debounce from 'lodash.debounce';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InlineMath } from 'react-katex';
import { ArrowDown, ArrowUp, GitMerge, Mountain, Sun } from 'lucide-react';
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
type CriticalPoint = {
  point: [number, number];
  type: 'local-maximum' | 'local-minimum' | 'saddle-point' | 'inconclusive';
  value: number;
}
type LagrangePoint = {
    point: number[];
    value: number;
}


// Unconstrained Optimization Component
function UnconstrainedOptimization() {
  const [result, setResult] = useState<CriticalPoint[] | null>(null);
  
  const form = useForm<UnconstrainedFormValues>({
    resolver: zodResolver(UnconstrainedSchema),
    defaultValues: { objectiveFunc: 'x^2 + y^2' },
  });

  const analyzeFunction = useCallback((funcStr: string) => {
    if (!funcStr) {
      setResult(null);
      return;
    }
    try {
      const node = math.parse(funcStr);
      const fx = math.derivative(node, 'x');
      const fy = math.derivative(node, 'y');
      const fxx = math.derivative(fx, 'x');
      const fyy = math.derivative(fy, 'y');
      const fxy = math.derivative(fx, 'y');

      const criticalPointsFound: CriticalPoint[] = [];

      // Test a grid of points to find where gradient is close to zero
      const testPoints: {x: number, y: number}[] = [];
      for(let x = -5; x<=5; x+=0.25) {
        for(let y = -5; y<=5; y+=0.25) {
          testPoints.push({x,y});
        }
      }
      // Add common points
      testPoints.push({x: 0, y: 0}, {x: 1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1});

      const uniquePoints = [...new Map(testPoints.map(item => [`${item.x.toFixed(2)},${item.y.toFixed(2)}`, item])).values()];

      uniquePoints.forEach(p => {
        try {
          const fx_val = fx.evaluate(p);
          const fy_val = fy.evaluate(p);

          // Check if point is a critical point (gradient is zero)
          if (Math.abs(fx_val) < 1e-4 && Math.abs(fy_val) < 1e-4) {
             const D = fxx.evaluate(p) * fyy.evaluate(p) - Math.pow(fxy.evaluate(p), 2);
             const fxx_val = fxx.evaluate(p);
             let type: CriticalPoint['type'] = 'inconclusive';

             if (Math.abs(D) < 1e-4) {
                type = 'inconclusive';
             } else if (D > 0 && fxx_val > 0) {
                type = 'local-minimum';
             } else if (D > 0 && fxx_val < 0) {
                type = 'local-maximum';
             } else if (D < 0) {
                type = 'saddle-point';
             }
             
             // Avoid adding duplicate points
             if (!criticalPointsFound.some(cp => math.deepEqual(cp.point.map(v => v.toFixed(2)), [p.x.toFixed(2), p.y.toFixed(2)]))) {
                criticalPointsFound.push({
                    point: [p.x, p.y],
                    type,
                    value: node.evaluate(p)
                });
             }
          }
        } catch (e) {
          // Ignore evaluation errors at specific points
        }
      });
      setResult(criticalPointsFound);

    } catch (e) {
      setResult(null);
    }
  }, []);

  const debouncedAnalyze = useCallback(debounce(analyzeFunction, 500), [analyzeFunction]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      debouncedAnalyze(value.objectiveFunc || '');
    });
    debouncedAnalyze(form.getValues('objectiveFunc'));
    return () => subscription.unsubscribe();
  }, [form, debouncedAnalyze]);
  
  const getPointIcon = (type: CriticalPoint['type']) => {
    switch (type) {
        case 'local-maximum': return <Sun className="mr-2 h-5 w-5 text-red-500" />;
        case 'local-minimum': return <Mountain className="mr-2 h-5 w-5 text-green-600" />;
        case 'saddle-point': return <GitMerge className="mr-2 h-5 w-5 text-yellow-500" />;
        default: return <div className="mr-2 h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form className="space-y-4" onSubmit={(e)=>e.preventDefault()}>
          <FormField
            control={form.control}
            name="objectiveFunc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Función Objetivo f(x, y)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: x^2 + y^2" className="font-code text-base" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      {result && (
        <Card className="fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Puntos Críticos Encontrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.length > 0 ? result.map((p, i) => (
                <div key={i}>
                    <h4 className="flex items-center font-semibold capitalize text-base">
                        {getPointIcon(p.type)}
                        {p.type.replace('-', ' ')}
                    </h4>
                    <p className="font-code text-sm pl-7 text-muted-foreground">
                        Valor f = <span className="text-foreground font-medium">{p.value.toFixed(4)}</span> en ({p.point[0].toFixed(3)}, {p.point[1].toFixed(3)})
                    </p>
                </div>
            )) : (
              <p className="text-sm text-muted-foreground">No se encontraron puntos críticos en el área de búsqueda.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function LagrangeOptimization() {
  const [result, setResult] = useState<{maxima: LagrangePoint[], minima: LagrangePoint[] } | null>(null);

  const form = useForm<LagrangeFormValues>({
    resolver: zodResolver(LagrangeSchema),
    defaultValues: { objectiveFunc: 'x*y', constraintFunc: 'x^2 + y^2 - 1' },
  });

  const analyzeFunction = useCallback((values: Partial<LagrangeFormValues>) => {
    const { objectiveFunc, constraintFunc } = values;
    if (!objectiveFunc || !constraintFunc) {
      setResult(null);
      return;
    }
    
    try {
        const f = math.parse(objectiveFunc).compile();
        const g = math.parse(constraintFunc).compile();

        const candidatePoints: {x: number, y: number}[] = [];
        const searchRange = 10;
        const step = 0.05;

        // Sample points in a grid and find those that satisfy the constraint g(x,y) = 0
        for (let x = -searchRange; x <= searchRange; x += step) {
            for (let y = -searchRange; y <= searchRange; y += step) {
                try {
                    if (Math.abs(g.evaluate({ x, y })) < 1e-2) {
                        candidatePoints.push({ x, y });
                    }
                } catch(e) { /* ignore eval errors */ }
            }
        }
        
        if (candidatePoints.length === 0) {
            setResult({ maxima: [], minima: [] });
            return;
        }

        const evaluatedPoints = candidatePoints.map(p => ({ point: [p.x, p.y], value: f.evaluate(p) }));
        
        const maxValue = Math.max(...evaluatedPoints.map(p => p.value));
        const minValue = Math.min(...evaluatedPoints.map(p => p.value));

        const maxima = evaluatedPoints.filter(p => Math.abs(p.value - maxValue) < 1e-6);
        const minima = evaluatedPoints.filter(p => Math.abs(p.value - minValue) < 1e-6);

        // Deduplicate nearby points
        const uniqueMaxima = [...new Map(maxima.map(item => [item.point.map(c => c.toFixed(2)).join(), item])).values()];
        const uniqueMinima = [...new Map(minima.map(item => [item.point.map(c => c.toFixed(2)).join(), item])).values()];

        setResult({
            maxima: uniqueMaxima,
            minima: uniqueMinima,
        });

    } catch (e) {
        setResult(null);
    }
  }, []);
  
  const debouncedAnalyze = useCallback(debounce(analyzeFunction, 500), [analyzeFunction]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      debouncedAnalyze(value);
    });
    debouncedAnalyze(form.getValues());
    return () => subscription.unsubscribe();
  }, [form, debouncedAnalyze]);


  return (
    <div className="space-y-4">
      <Form {...form}>
        <form className="space-y-4" onSubmit={(e)=>e.preventDefault()}>
          <FormField
            control={form.control}
            name="objectiveFunc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Función Objetivo f(x, y)</FormLabel>
                <FormControl><Input placeholder="Ej: x*y" className="font-code text-base" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Ej: x^2 + y^2 - 1" className="font-code text-base" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      {result ? (
        <Card className="fade-in">
          <CardHeader><CardTitle className="text-lg">Resultados de la Optimización (Numérico)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {result.maxima.length > 0 && (
              <div>
                <h4 className="flex items-center font-semibold text-base text-green-600"><ArrowUp className="mr-2 h-5 w-5" />Máximo(s) Encontrado(s)</h4>
                {result.maxima.map((m, i) => (
                   <p key={i} className="font-code text-sm pl-7 text-muted-foreground">
                    Valor f ≈ <span className="text-foreground font-medium">{m.value.toFixed(4)}</span> en ({m.point[0].toFixed(3)}, {m.point[1].toFixed(3)})
                  </p>
                ))}
              </div>
            )}
            {result.minima.length > 0 && (
              <div>
                <h4 className="flex items-center font-semibold text-base text-red-600"><ArrowDown className="mr-2 h-5 w-5" />Mínimo(s) Encontrado(s)</h4>
                {result.minima.map((m, i) => (
                  <p key={i} className="font-code text-sm pl-7 text-muted-foreground">
                     Valor f ≈ <span className="text-foreground font-medium">{m.value.toFixed(4)}</span> en ({m.point[0].toFixed(3)}, {m.point[1].toFixed(3)})
                  </p>
                ))}
              </div>
            )}
             {result.minima.length === 0 && result.maxima.length === 0 && (
                <p className="text-sm text-muted-foreground">No se encontraron puntos óptimos en el área de búsqueda. Asegúrate de que la restricción `g(x,y)=0` defina una curva válida.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="fade-in">
           <CardHeader><CardTitle className="text-lg">Resultados de la Optimización</CardTitle></CardHeader>
           <CardContent>
            <p className="text-sm text-muted-foreground">Introduce una función y una restricción para encontrar los puntos óptimos.</p>
           </CardContent>
        </Card>
      )}
    </div>
  );
}


// Main Component
export function OptimizationSection() {
  return (
    <div className="space-y-4 fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Optimización de Funciones</CardTitle>
          <CardDescription>
            Encuentra puntos óptimos de una función, con o sin restricciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unconstrained" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unconstrained">Sin Restricciones</TabsTrigger>
              <TabsTrigger value="lagrange">Lagrange (Numérico)</TabsTrigger>
            </TabsList>
            <TabsContent value="unconstrained" className="pt-6">
              <UnconstrainedOptimization />
            </TabsContent>
            <TabsContent value="lagrange" className="pt-6">
              <LagrangeOptimization />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
