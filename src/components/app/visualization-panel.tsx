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
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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

  const chartData = useMemo(() => {
    if (!funcStr) return { data: [], error: null };
    try {
      const node = math.parse(funcStr);
      const code = node.compile();
      const [min, max] = domain;
      const step = (max - min) / (CHART_POINTS - 1);
      const data = [];

      for (let i = 0; i < CHART_POINTS; i++) {
        const x = min + i * step;
        let y = null;
        try {
           y = code.evaluate({ x });
           // Evitar valores infinitos o no numéricos que rompen la gráfica
           if (!isFinite(y)) {
             y = null;
           }
        } catch (e) {
          // Si un punto falla (ej. log(-1)), lo omitimos para no romper la gráfica
        }
        data.push({ x: x.toFixed(3), y });
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error parsing or evaluating function:", error);
      return { data: [], error: "No se pudo evaluar la función. Revisa la sintaxis." };
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
              <CardTitle>Visualización 2D</CardTitle>
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
          {chartData.error ? (
             <div className="text-center text-destructive flex flex-col items-center gap-2">
                <AlertTriangle className="h-8 w-8" />
                <p>{chartData.error}</p>
             </div>
          ) : !funcStr || chartData.data.length === 0 ? (
             <div className="text-center text-muted-foreground">
                <p>Introduce una función para ver la gráfica.</p>
            </div>
          ) : (
            <ChartContainer config={{y: {label: "y"}, x: {label: "x"}}} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="x" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(val) => parseFloat(val).toFixed(1)}
                    label={{ value: 'x', position: 'insideBottomRight', offset: -10 }}
                    stroke="hsl(var(--foreground))"
                    tickCount={10}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    label={{ value: 'y', angle: -90, position: 'insideLeft' }}
                    stroke="hsl(var(--foreground))"
                  />
                  <ChartTooltip
                    cursor={{stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: "5 5"}}
                    content={<ChartTooltipContent 
                      labelFormatter={(label, payload) => payload?.[0] ? `x: ${payload[0].payload.x}` : label }
                      formatter={(value) => typeof value === 'number' ? value.toFixed(3) : 'N/A'}
                    />}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.5} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.5} />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false}
                    connectNulls={false} // No conectar puntos donde la función no está definida
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
