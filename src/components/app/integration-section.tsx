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
        <CardTitle>Integración Múltiple</CardTitle>
        <CardDescription>
          Calcula integrales dobles y triples sobre regiones definidas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Tipo de Integral</Label>
          <Select defaultValue="double">
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo de integral" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="double">Integral Doble (Volumen)</SelectItem>
              <SelectItem value="triple">Integral Triple (Masa)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Límites de Integración</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x-min">x-mín</Label>
              <Input id="x-min" defaultValue="-2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="x-max">x-máx</Label>
              <Input id="x-max" defaultValue="2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-min">y-mín</Label>
              <Input id="y-min" defaultValue="-2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="y-max">y-máx</Label>
              <Input id="y-max" defaultValue="2" className="font-code"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="z-min">z-mín</Label>
              <Input id="z-min" defaultValue="0" className="font-code"/>
            </div>
             <div className="space-y-2">
              <Label htmlFor="z-max">z-máx (opcional)</Label>
              <Input id="z-max" placeholder="f(x,y)" className="font-code"/>
            </div>
          </div>
        </div>

        <Button className="w-full">Calcular Integral</Button>

        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle>Resultado</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold font-code text-center text-primary">1.1394</p>
                <p className="text-center text-muted-foreground text-sm mt-1">Volumen bajo la superficie</p>
            </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
