'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function OptimizationSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constrained Optimization</CardTitle>
        <CardDescription>
          Find optima using Lagrange multipliers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="objective-func">Objective Function f(x, y)</Label>
          <Input id="objective-func" placeholder="e.g., x*y" defaultValue="x*y" className="font-code"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-func">Constraint g(x, y) = c</Label>
          <Input id="constraint-func" placeholder="e.g., x^2 + y^2 - 1" defaultValue="x^2 + y^2 - 1" className="font-code"/>
        </div>

        <Button className="w-full">Find Optimal Points</Button>
        
        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-medium text-green-600">Maximum</h4>
                    <p className="font-code text-sm">f = 0.5 at (0.707, 0.707) and (-0.707, -0.707)</p>
                </div>
                <div>
                    <h4 className="font-medium text-red-600">Minimum</h4>
                    <p className="font-code text-sm">f = -0.5 at (0.707, -0.707) and (-0.707, 0.707)</p>
                </div>
            </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
