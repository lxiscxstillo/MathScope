'use client';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as math from 'mathjs';
import * as d3 from 'd3-zoom';
import { scaleLinear, ScaleLinear } from 'd3-scale';
import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TICK_MIN_SPACING = 50; // Minimum pixels between ticks

export function VisualizationPanel() {
  const { state } = useAppState();
  const { func: funcStr } = state;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown>>();
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const parsedFunc = useMemo(() => {
    if (!funcStr) {
      setError(null);
      return null;
    }
    try {
      const node = math.parse(funcStr);
      const compiled = node.compile();
       // Test evaluation
      compiled.evaluate({ x: 1, y: 1 });
      setError(null);
      return compiled;
    } catch (e: any) {
      console.error("Error parsing function:", e);
      setError(`Error en la función: ${e.message}`);
      return null;
    }
  }, [funcStr]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
        .scaleExtent([0.1, 20]) // Zoom range
        .on('zoom', (event) => {
            setTransform(event.transform);
        });
    
    zoomRef.current = zoomBehavior;
    d3.select(canvas).call(zoomBehavior);

    // Initial transform setup
    const { width, height } = canvas.getBoundingClientRect();
    const initialScale = Math.min(width, height) / 10;
    const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initialScale);
    
    d3.select(canvas).call(zoomBehavior.transform, initialTransform);
    setTransform(initialTransform);


     // Reset zoom when function changes
    const selection = d3.select(canvas);
    selection.call(zoomBehavior.transform, initialTransform);
    toast({ title: 'Vista Restablecida', description: 'El zoom y la posición se han reiniciado.' });


  }, [funcStr, toast]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);

    // Create scales for x and y axes based on d3 transform
    const xScale = transform.rescaleX(scaleLinear().domain([-width / 2, width / 2]).range([0, width]));
    const yScale = transform.rescaleY(scaleLinear().domain([-height / 2, height / 2]).range([height, 0]));
    
    // Draw grid, axes, and function
    drawGrid(context, xScale, yScale);
    drawAxes(context, xScale, yScale);
    if (parsedFunc && !error) {
        drawFunction(context, parsedFunc, xScale, yScale);
    }

  }, [transform, parsedFunc, error]);

  const drawGrid = (ctx: CanvasRenderingContext2D, xScale: ScaleLinear<number, number>, yScale: ScaleLinear<number, number>) => {
    ctx.beginPath();
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 0.5;

    const xTicks = xScale.ticks(width / TICK_MIN_SPACING);
    const yTicks = yScale.ticks(height / TICK_MIN_SPACING);

    xTicks.forEach(tick => {
        ctx.moveTo(xScale(tick), 0);
        ctx.lineTo(xScale(tick), height);
    });

    yTicks.forEach(tick => {
        ctx.moveTo(0, yScale(tick));
        ctx.lineTo(width, yScale(tick));
    });

    ctx.stroke();
};

const drawAxes = (ctx: CanvasRenderingContext2D, xScale: ScaleLinear<number, number>, yScale: ScaleLinear<number, number>) => {
    ctx.beginPath();
    ctx.strokeStyle = 'hsl(var(--foreground) / 0.7)';
    ctx.lineWidth = 1.5;

    // Y-axis (at x=0)
    ctx.moveTo(xScale(0), 0);
    ctx.lineTo(xScale(0), height);

    // X-axis (at y=0)
    ctx.moveTo(0, yScale(0));
    ctx.lineTo(width, yScale(0));

    ctx.stroke();

    // Draw labels
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const xTicks = xScale.ticks(width / TICK_MIN_SPACING);
    xTicks.forEach(tick => {
        if (tick === 0) return;
        ctx.fillText(tick.toString(), xScale(tick), yScale(0) + 5);
    });

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = yScale.ticks(height / TICK_MIN_SPACING);
    yTicks.forEach(tick => {
        if (tick === 0) return;
        ctx.fillText(tick.toString(), xScale(0) - 5, yScale(tick));
    });
};

const drawFunction = (ctx: CanvasRenderingContext2D, func: math.MathNode, xScale: ScaleLinear<number, number>, yScale: ScaleLinear<number, number>) => {
    ctx.beginPath();
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;

    const [xMin, xMax] = xScale.domain();
    
    for (let i = 0; i <= width; i++) {
        const x = xScale.invert(i);
        try {
            const y = func.evaluate({ x });
             if (!isFinite(y)) {
                ctx.stroke(); // End current path
                ctx.beginPath(); // Start a new one
                continue;
            }
            const yPos = yScale(y);

            if (i === 0) {
                ctx.moveTo(i, yPos);
            } else {
                ctx.lineTo(i, yPos);
            }
        } catch (e) {
            // function might be undefined at this point, just skip
        }
    }
    ctx.stroke();
};


  const { width, height } = canvasRef.current?.getBoundingClientRect() || { width: 0, height: 0 };

  return (
    <div id="visualization-panel" className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div>
            <CardTitle>Calculadora Gráfica</CardTitle>
            <CardDescription className="font-code text-primary pt-1">
              f(x) = {funcStr || 'Ninguna función definida'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center relative bg-background rounded-b-lg overflow-hidden p-0">
          <canvas ref={canvasRef} className="w-full h-full cursor-move" />

           {(error || !funcStr) && (
             <div className="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none">
                <div className="text-center text-muted-foreground flex flex-col items-center gap-2 p-4 rounded-lg bg-background border">
                  {error ? <AlertTriangle className="h-8 w-8 text-destructive" /> : <div className="h-8 w-8" />}
                  {error ? <p className="text-destructive max-w-xs">{error}</p> : <p>Introduce una función para ver la gráfica.</p>}
                </div>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
