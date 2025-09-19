'use client';
import { useState, useCallback, useTransition } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { convertNaturalTo3DFunction } from '@/ai/flows/natural-to-3d-function';
import { BrainCircuit } from 'lucide-react';

const FormSchema = z.object({
  func: z.string().min(1, 'La función es obligatoria.'),
});

type Function3DSectionProps = {
  setFunc3D: (func: string) => void;
};

export function Function3DSection({ setFunc3D }: Function3DSectionProps) {
  const [isValid, setIsValid] = useState<boolean | null>(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      func: 'sin(sqrt(x^2 + y^2)) / sqrt(x^2 + y^2)',
    },
  });

  const validateFunction = (funcStr: string) => {
    if (!funcStr) {
      setIsValid(null);
      return;
    }
    try {
      math.parse(funcStr).compile().evaluate({ x: 1, y: 1 });
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
    startTransition(async () => {
      try {
        const result = await convertNaturalTo3DFunction({ description: data.func });
        const aiFunc = result.func;
        
        form.setValue('func', aiFunc);
        validateFunction(aiFunc);
        setFunc3D(aiFunc);
        toast({
          title: 'Función Interpretada y Graficada',
          description: `IA interpretó: z = ${aiFunc}`,
        });
      } catch (error) {
         console.error('Error con la IA, usando la entrada directa', error);
         setFunc3D(data.func);
         toast({
            title: 'Función Actualizada',
            description: `Graficando la función: z = ${data.func}`,
         });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Función 3D</CardTitle>
        <CardDescription>Introduce una función z = f(x, y) o describe una forma en lenguaje natural.</CardDescription>
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
                    <FormLabel>z = f(x, y) =</FormLabel>
                    {isValid !== null && (
                      <Badge variant={isValid ? 'default' : 'destructive'} className={isValid ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                        {isValid ? 'Válida' : 'Inválida'}
                      </Badge>
                    )}
                  </div>
                  <FormControl>
                    <Input placeholder="Ej: esfera de radio 2" {...field} onChange={handleFunctionChange} className="font-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={!isValid || isPending}>
              {isPending ? (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4 animate-pulse" />
                  Interpretando...
                </>
              ) : (
                'Graficar con IA'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
