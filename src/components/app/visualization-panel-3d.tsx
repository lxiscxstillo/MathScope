'use client';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as math from 'mathjs';
import * as d3 from 'd3-zoom';
import { select } from 'd3-selection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Point3D = [number, number, number];
type Point2D = [number, number];

export function VisualizationPanel3D({ funcStr }: { funcStr: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [angles, setAngles] = useState({ x: -0.5, y: 0.5, z: 0 });
  const [zoom, setZoom] = useState(25);
  const dragStart = useRef<{ x: number; y: number; angles: typeof angles } | null>(null);

  const parsedFunc = useMemo(() => {
    if (!funcStr) {
      setError(null);
      return null;
    }
    try {
      const node = math.parse(funcStr);
      const compiled = node.compile();
      compiled.evaluate({ x: 1, y: 1 });
      setError(null);
      return compiled;
    } catch (e: any) {
      setError(`Error en la función: ${e.message}`);
      return null;
    }
  }, [funcStr]);

  const project = (p: Point3D): Point2D => {
    let { x, y, z } = { x: p[0], y: p[1], z: p[2] };
    const rad = angles;
    const cosa = Math.cos(rad.z), sina = Math.sin(rad.z);
    const cosb = Math.cos(rad.y), sinb = Math.sin(rad.y);
    const cosc = Math.cos(rad.x), sinc = Math.sin(rad.x);

    const Axx = cosa * cosb;
    const Axy = cosa * sinb * sinc - sina * cosc;
    const Axz = cosa * sinb * cosc + sina * sinc;
    const Ayx = sina * cosb;
    const Ayy = sina * sinb * sinc + cosa * cosc;
    const Ayz = sina * sinb * cosc - cosa * sinc;
    const Azx = -sinb;
    const Azy = cosb * sinc;
    const Azz = cosb * cosc;

    const px = Axx * x + Axy * y + Axz * z;
    const py = Ayx * x + Ayy * y + Ayz * z;
    
    return [px * zoom, -py * zoom];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (event: MouseEvent) => {
      dragStart.current = { x: event.clientX, y: event.clientY, angles: { ...angles } };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (dragStart.current) {
        const dx = event.clientX - dragStart.current.x;
        const dy = event.clientY - dragStart.current.y;
        setAngles({
          ...dragStart.current.angles,
          y: dragStart.current.angles.y + dx * 0.01,
          x: dragStart.current.angles.x - dy * 0.01,
        });
      }
    };

    const handleMouseUp = () => {
      dragStart.current = null;
    };
    
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom(z => Math.max(5, Math.min(100, z - event.deltaY * 0.01)));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [angles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);
    context.translate(width / 2, height / 2);

    const step = 0.5;
    const range = 10;
    
    // Draw axes
    context.strokeStyle = 'hsl(var(--muted-foreground))';
    context.lineWidth = 1;
    const axisLength = range * 1.2;
    const xAxis: [Point3D, Point3D] = [[-axisLength, 0, 0], [axisLength, 0, 0]];
    const yAxis: [Point3D, Point3D] = [[0, -axisLength, 0], [0, axisLength, 0]];
    const zAxis: [Point3D, Point3D] = [[0, 0, -axisLength], [0, 0, axisLength]];
    
    [xAxis, yAxis, zAxis].forEach((axis, i) => {
        context.beginPath();
        const p1 = project(axis[0]);
        const p2 = project(axis[1]);
        context.moveTo(p1[0], p1[1]);
        context.lineTo(p2[0], p2[1]);
        context.stroke();
        context.fillStyle = ['red', 'green', 'blue'][i];
        context.font = '14px Inter';
        const labelPos = project([axis[1][0]*1.1, axis[1][1]*1.1, axis[1][2]*1.1]);
        context.fillText(['x','y','z'][i], labelPos[0], labelPos[1]);
    });


    if (parsedFunc && !error) {
      context.strokeStyle = 'hsl(var(--primary))';
      context.lineWidth = 0.5;
      for (let x = -range; x <= range; x += step) {
        context.beginPath();
        let first = true;
        for (let y = -range; y <= range; y += step) {
          try {
            const z = parsedFunc.evaluate({ x, y });
            if (isFinite(z)) {
              const p2d = project([x, y, z]);
              if (first) {
                context.moveTo(p2d[0], p2d[1]);
                first = false;
              } else {
                context.lineTo(p2d[0], p2d[1]);
              }
            } else {
              first = true;
            }
          } catch (e) {
            first = true;
          }
        }
        context.stroke();
      }

      for (let y = -range; y <= range; y += step) {
        context.beginPath();
        let first = true;
        for (let x = -range; x <= range; x += step) {
          try {
            const z = parsedFunc.evaluate({ x, y });
            if (isFinite(z)) {
              const p2d = project([x, y, z]);
              if (first) {
                context.moveTo(p2d[0], p2d[1]);
                first = false;
              } else {
                context.lineTo(p2d[0], p2d[1]);
              }
            } else {
              first = true;
            }
          } catch (e) {
            first = true;
          }
        }
        context.stroke();
      }
    }

  }, [funcStr, parsedFunc, error, angles, zoom]);

  return (
    <div id="visualization-panel-3d" className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div>
            <CardTitle>Calculadora Gráfica 3D</CardTitle>
            <CardDescription className="font-code text-primary pt-1">
              z = {funcStr || 'Ninguna función definida'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center relative bg-background rounded-b-lg overflow-hidden p-0">
          <canvas ref={canvasRef} className="w-full h-full cursor-move" />

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none">
              <div className="text-center text-muted-foreground flex flex-col items-center gap-2 p-4 rounded-lg bg-background border">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-destructive max-w-xs">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
