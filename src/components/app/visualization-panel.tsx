'use client';
import { useMemo } from 'react';
import * as math from 'mathjs';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Frown } from 'lucide-react';

const generatePlotData = (func: string, domain = [-5, 5], resolution = 40) => {
  if (!func) return { data: [], error: null, zDomain: [0,0] };

  let node;
  try {
    node = math.parse(func);
    node.compile().evaluate({ x: 1, y: 1 }); // Test evaluation
  } catch (e: any) {
    return { data: [], error: `Función inválida: ${e.message}`, zDomain: [0,0] };
  }

  const data = [];
  const step = (domain[1] - domain[0]) / resolution;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let x = domain[0]; x <= domain[1]; x += step) {
    for (let y = domain[0]; y <= domain[1]; y += step) {
      try {
        const z = node.compile().evaluate({ x, y });
        if (typeof z === 'number' && isFinite(z)) {
          data.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), z });
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
      } catch (e) {
        // Ignore evaluation errors for specific points (e.g., division by zero)
      }
    }
  }

  if (!isFinite(minZ)) minZ = 0;
  if (!isFinite(maxZ)) maxZ = 1;
  if (minZ === maxZ) {
    minZ = maxZ - 1;
    maxZ = maxZ + 1;
  }

  return { data, error: null, zDomain: [minZ, maxZ] };
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-2 rounded-md shadow-lg">
        <p className="font-bold font-code">{`f(${data.x}, ${data.y}) = ${data.z.toFixed(4)}`}</p>
      </div>
    );
  }
  return null;
};

export function VisualizationPanel() {
  const { state } = useAppState();
  const { data, error, zDomain } = useMemo(() => generatePlotData(state.func), [state.func]);

  return (
    <div className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Visualización de la Función</CardTitle>
          <CardDescription className="font-code text-primary">
            {state.func || "Ninguna función definida"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          {error && (
            <Alert variant="destructive" className="w-auto">
               <Frown className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          {!error && data.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="x" unit="" domain={['dataMin', 'dataMax']} />
                <YAxis type="number" dataKey="y" name="y" unit="" domain={['dataMin', 'dataMax']} />
                <ZAxis type="number" dataKey="z" name="z" range={[1, 200]} domain={zDomain} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Legend />
                <Scatter name="f(x, y)" data={data} fill="hsl(var(--primary))" shape="dot" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
          {!error && data.length === 0 && (
             <div className="z-10 text-center text-muted-foreground p-4">
                <p className="text-lg font-medium">Gráfico de Contorno 2D</p>
                <p className="text-sm mt-2">El gráfico de la función aparecerá aquí</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
