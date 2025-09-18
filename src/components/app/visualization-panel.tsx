'use client';

import React, { useMemo } from 'react';
import * as math from 'mathjs';
import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const CHART_POINTS = 200;

export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func: funcStr, domain } = state;

  const { data: chartData, error, yDomain } = useMemo(() => {
    if (!funcStr) return { data: [], error: null, yDomain: [-5, 5] };
    try {
      const node = math.parse(funcStr);
      const code = node.compile();
      const [min, max] = domain;
      if (min === max) return { data: [], error: null, yDomain: [-5, 5]};
      const step = (max - min) / (CHART_POINTS - 1);
      const data = [];
      let maxAbsY = 0;

      for (let i = 0; i < CHART_POINTS; i++) {
        const x = min + i * step;
        let y = null;
        try {
           y = code.evaluate({ x });
           if (!isFinite(y) || Math.abs(y) > 1e6) { // Limit extreme values
             y = null;
           } else {
             maxAbsY = Math.max(maxAbsY, Math.abs(y));
           }
        } catch (e) {
          // If a point fails, we skip it
        }
        data.push({ x: Number(x.toFixed(4)), y });
      }
      
      const yRange = maxAbsY === 0 ? 5 : Math.max(maxAbsY, Math.abs(domain[0]), Math.abs(domain[1]));
      const finalYDomain: [number, number] = [-yRange, yRange];

      return { data, error: null, yDomain: finalYDomain };
    } catch (error) {
      console.error("Error parsing or evaluating function:", error);
      return { data: [], error: "No se pudo evaluar la función. Revisa la sintaxis.", yDomain: [-5, 5] };
    }
  }, [funcStr, domain]);

  const handleZoomIn = () => dispatch({ type: 'ZOOM_IN' });
  const handleZoomOut = () => dispatch({ type: 'ZOOM_OUT' });
  const handleResetZoom = () => dispatch({ type: 'RESET_ZOOM' });

  return (
    <div id="visualization-panel" className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Calculadora Gráfica</CardTitle>
              <CardDescription className="font-code text-primary pt-1">
                f(x) = {funcStr || 'Ninguna función definida'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomIn} title="Acercar">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut} title="Alejar">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleResetZoom} title="Restablecer Vista">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center relative bg-background rounded-b-lg overflow-hidden">
          {error ? (
             <div className="text-center text-destructive flex flex-col items-center gap-2">
                <AlertTriangle className="h-8 w-8" />
                <p>{error}</p>
             </div>
          ) : !funcStr || chartData.length === 0 ? (
             <div className="text-center text-muted-foreground">
                <p>Introduce una función para ver la gráfica.</p>
            </div>
          ) : (
            <ChartContainer config={{y: {label: "y"}, x: {label: "x"}}} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    type="number"
                    domain={domain}
                    axisLine={{stroke: "hsl(var(--foreground))", strokeWidth: 1}}
                    tickLine={{stroke: "hsl(var(--foreground))"}}
                    tick={{fill: "hsl(var(--muted-foreground))", fontSize: 12}}
                    tickFormatter={(val) => val === 0 ? '' : val.toFixed(0)}
                    label={{ value: 'x', position: 'right', offset: 10, fill: "hsl(var(--muted-foreground))" }}
                    allowDataOverflow
                  />
                  <YAxis 
                    type="number"
                    domain={yDomain}
                    axisLine={{stroke: "hsl(var(--foreground))", strokeWidth: 1}}
                    tickLine={{stroke: "hsl(var(--foreground))"}}
                    tick={{fill: "hsl(var(--muted-foreground))", fontSize: 12, dx: -5}}
                    tickFormatter={(val) => val === 0 ? '' : val.toFixed(0)}
                    label={{ value: 'y', position: 'top', offset: 10, fill: "hsl(var(--muted-foreground))" }}
                    allowDataOverflow
                  />
                  <ChartTooltip
                    cursor={{stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: "none"}}
                    content={<ChartTooltipContent 
                      indicator='line'
                      labelFormatter={(label, payload) => payload?.[0] ? `x: ${payload[0].payload.x}` : label }
                      formatter={(value, name) => [typeof value === 'number' ? value.toFixed(4) : 'N/A', 'f(x)']}
                    />}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
