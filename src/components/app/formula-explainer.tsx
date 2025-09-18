'use client';

import { useState, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { explainFormula } from '@/ai/flows/formula-explanation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

const FormSchema = z.object({
  formula: z.string().min(1, 'Por favor, introduce una fórmula.'),
  language: z.string().min(1, 'Por favor, selecciona un idioma.'),
});

type FormValues = z.infer<typeof FormSchema>;

export function FormulaExplainer() {
  const [isPending, startTransition] = useTransition();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      formula: 'e^(i*pi) + 1 = 0',
      language: 'Español',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(async () => {
      setError(null);
      setExplanation(null);
      try {
        const result = await explainFormula(data);
        setExplanation(result.explanation);
      } catch (e) {
        setError('Ocurrió un error al obtener la explicación. Por favor, intenta de nuevo.');
        console.error(e);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Explicador de Fórmulas</CardTitle>
          <CardDescription>
            Obtén una explicación de IA para una fórmula matemática en el idioma que elijas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="formula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fórmula (lenguaje natural)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: f(x) = x^2"
                        className="font-code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un idioma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Español">Español</SelectItem>
                        <SelectItem value="Inglés">Inglés</SelectItem>
                        <SelectItem value="Francés">Francés</SelectItem>
                        <SelectItem value="Alemán">Alemán</SelectItem>
                        <SelectItem value="Japonés">Japonés</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Generando...' : 'Explicar Fórmula'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle>Explicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

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

      {explanation && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle>Explicación</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground">
            {explanation.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
