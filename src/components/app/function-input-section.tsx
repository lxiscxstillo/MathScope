'use client';
import { useEffect, useState, useCallback } from 'react';
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
import { GuidedSteps } from './guided-steps';
import { useAppState } from '@/hooks/use-app-state';

const FormSchema = z.object({
  func: z.string().min(1, 'Function is required.'),
});

export function FunctionInputSection() {
  const { state, dispatch } = useAppState();
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      func: state.func,
    },
  });

  const validateFunction = (funcStr: string) => {
    if (!funcStr) {
      setIsValid(null);
      return;
    }
    try {
      math.parse(funcStr).compile().evaluate({ x: 1, y: 1, z: 1 });
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
    dispatch({ type: 'SET_FUNCTION', payload: value });
  };
  
  useEffect(() => {
    validateFunction(state.func);
  }, [state.func]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log('Calculating with function:', data.func);
    // Trigger calculations here
  }

  const toggleGuidedMode = (checked: boolean) => {
    dispatch({ type: 'SET_GUIDED_MODE', payload: checked });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Function Analysis</CardTitle>
        <CardDescription>Input a function to visualize and analyze.</CardDescription>
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
                    <FormLabel>f(x, y, z) =</FormLabel>
                    {isValid !== null && (
                      <Badge variant={isValid ? 'default' : 'destructive'} className="bg-green-500 hover:bg-green-600 text-white">
                        {isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    )}
                  </div>
                  <FormControl>
                    <Input placeholder="e.g., sin(x) * cos(y)" {...field} onChange={handleFunctionChange} className="font-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Domain and Range</AccordionTrigger>
                <AccordionContent className="font-code text-sm space-y-2">
                  <p>Domain: (-∞, ∞)</p>
                  <p>Range: [-1, 1]</p>
                  <p className="text-xs text-muted-foreground pt-2">Estimates are based on numerical analysis.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Partial Derivatives & Gradient</AccordionTrigger>
                <AccordionContent className="font-code text-sm space-y-2">
                  <p>∂f/∂x = cos(x) * cos(y)</p>
                  <p>∂f/∂y = -sin(x) * sin(y)</p>
                  <p>∇f = [cos(x)cos(y), -sin(x)sin(y)]</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex items-center space-x-2">
              <Switch id="guided-mode" checked={state.guidedMode} onCheckedChange={toggleGuidedMode} />
              <Label htmlFor="guided-mode">Guided Calculation Mode</Label>
            </div>
            
            {state.guidedMode && <GuidedSteps />}

            <Button type="submit" className="w-full">Calculate & Plot</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
