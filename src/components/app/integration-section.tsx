'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function IntegrationSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Multiple Integration</CardTitle>
        <CardDescription>
          Calculate double and triple integrals over defined regions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Integration Type</Label>
          <Select defaultValue="double">
            <SelectTrigger>
              <SelectValue placeholder="Select integration type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="double">Double Integral (Volume)</SelectItem>
              <SelectItem value="triple">Triple Integral (Mass)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Integration Bounds</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x-min">x-min</Label>
              <Input id="x-min" defaultValue="-2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-max">x-max</Label>
              <Input id="x-max" defaultValue="2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-min">y-min</Label>
              <Input id="y-min" defaultValue="-2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-max">y-max</Label>
              <Input id="y-max" defaultValue="2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-min">z-min</Label>
              <Input id="z-min" defaultValue="0" className="font-code"/>
            </div>
             <div className="space-y-2">
              <Label htmlFor="z-max">z-max (optional)</Label>
              <Input id="z-max" placeholder="f(x,y)" className="font-code"/>
            </div>
          </div>
        </div>

        <Button className="w-full">Calculate Integral</Button>

        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold font-code text-center text-primary">1.1394</p>
                <p className="text-center text-muted-foreground text-sm mt-1">Volume under surface</p>
            </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
