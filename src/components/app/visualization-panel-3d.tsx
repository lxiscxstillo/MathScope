'use client';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as math from 'mathjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Blend } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

type Point3D = [number, number, number];
type Point2D = [number, number];
type Polygon = {
  points: [Point3D, Point3D, Point3D, Point3D];
  avgZ: number;
  color: string;
};


type VisualizationPanel3DProps = {
  funcStr: string;
  gradFns: { fx: math.EvalFunction, fy: math.EvalFunction } | null;
};

export function VisualizationPanel3D({ funcStr, gradFns }: VisualizationPanel3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const [angles, setAngles] = useState({ x: -0.5, y: 0.5, z: 0 });
  const [zoom, setZoom] = useState(25);
  const dragStart = useRef<{ x: number; y: number; angles: typeof angles } | null>(null);
  const [showGradient, setShowGradient] = useState(false);

  const { parsedFunc, polygons, zRange } = useMemo(() => {
    if (!funcStr) {
      setError(null);
      return { parsedFunc: null, polygons: [], zRange: { min: -5, max: 5 } };
    }
    try {
      const node = math.parse(funcStr);
      const compiled = node.compile();
      compiled.evaluate({ x: 1, y: 1 }); // Test evaluation
      setError(null);

      const step = 0.5;
      const range = 10;
      const pointsGrid: (Point3D | null)[][] = [];
      let minZ = Infinity;
      let maxZ = -Infinity;

      const numSteps = Math.ceil(2 * range / step);

      for (let i = 0; i <= numSteps; i++) {
        const x = -range + i * step;
        pointsGrid[i] = [];
        for (let j = 0; j <= numSteps; j++) {
          const y = -range + j * step;
          try {
            const z = compiled.evaluate({ x, y });
            if (isFinite(z)) {
              pointsGrid[i][j] = [x, y, z];
              if (z < minZ) minZ = z;
              if (z > maxZ) maxZ = z;
            } else {
              pointsGrid[i][j] = null;
            }
          } catch (e) {
            pointsGrid[i][j] = null;
          }
        }
      }
      
      const finalZRange = isFinite(minZ) && isFinite(maxZ) ? { min: minZ, max: maxZ } : { min: -5, max: 5 };
      if (finalZRange.min === finalZRange.max) {
        finalZRange.min -= 1;
        finalZRange.max += 1;
      }

      // Create polygons from grid
      const polyList: Polygon[] = [];
      for (let i = 0; i < numSteps; i++) {
        for (let j = 0; j < numSteps; j++) {
          const p1 = pointsGrid[i][j];
          const p2 = pointsGrid[i + 1][j];
          const p3 = pointsGrid[i + 1][j + 1];
          const p4 = pointsGrid[i][j + 1];

          if (p1 && p2 && p3 && p4) {
            const avgZ = (p1[2] + p2[2] + p3[2] + p4[2]) / 4;
            
            // Simple lighting calculation based on surface normal
            const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
            const v2 = [p4[0] - p1[0], p4[1] - p1[1], p4[2] - p1[2]];
            const normalZ = v1[0] * v2[1] - v1[1] * v2[0]; // Simplified cross product z-component
            
            const light = 0.7 + normalZ * 0.3; // Base light + normal contribution
            const colorVal = Math.floor(light * 150) + 50; // Map to a blue shade
            const color = `hsl(212, 100%, ${Math.max(20, Math.min(80, 100 - colorVal/2.5))}%)`;

            polyList.push({ points: [p1, p2, p3, p4], avgZ, color });
          }
        }
      }

      return { parsedFunc: compiled, polygons: polyList, zRange: finalZRange };
    } catch (e: any) {
      setError(`Error en la función: ${e.message}`);
      return { parsedFunc: null, polygons: [], zRange: { min: -5, max: 5 } };
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
      setZoom(z => Math.max(5, Math.min(100, z - event.deltaY * 0.05)));
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

    const range = 10;
    
    // Draw axes
    context.strokeStyle = 'hsl(var(--muted-foreground))';
    context.lineWidth = 1;
    const axisLength = range * 1.2;
    const zAxisLength = Math.max(Math.abs(zRange.min), Math.abs(zRange.max), range) * 1.1;
    const xAxis: [Point3D, Point3D] = [[-axisLength, 0, 0], [axisLength, 0, 0]];
    const yAxis: [Point3D, Point3D] = [[0, -axisLength, 0], [0, axisLength, 0]];
    const zAxis: [Point3D, Point3D] = [[0, 0, -zAxisLength], [0, 0, zAxisLength]];
    
    [xAxis, yAxis, zAxis].forEach((axis, i) => {
        context.beginPath();
        const p1 = project(axis[0]);
        const p2 = project(axis[1]);
        context.moveTo(p1[0], p1[1]);
        context.lineTo(p2[0], p2[1]);
        context.stroke();
        context.fillStyle = 'hsl(var(--foreground))';
        context.font = '14px Inter';
        const labelPos = project([axis[1][0]*1.1, axis[1][1]*1.1, axis[1][2]*1.1]);
        context.fillText(['x','y','z'][i], labelPos[0], labelPos[1]);
    });

    // Draw numeric labels on axes
    const tickStep = 2; 
    context.fillStyle = 'hsl(var(--muted-foreground))';
    context.font = '12px Inter';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (let i = -range; i <= range; i += tickStep) {
        if (i === 0) continue;
        
        // X-axis ticks
        const xTickPos = project([i, 0, 0]);
        context.fillText(i.toString(), xTickPos[0], xTickPos[1] + 10);

        // Y-axis ticks
        const yTickPos = project([0, i, 0]);
        context.fillText(i.toString(), yTickPos[0], yTickPos[1] + 10);
    }
    
    const zTickCount = 5;
    if (zRange.max - zRange.min > 1e-9) {
      const zTickStep = (zRange.max - zRange.min) / zTickCount;
      for(let i = 0; i <= zTickCount; i++) {
          const zVal = zRange.min + i * zTickStep;
          if (Math.abs(zVal) < 1e-9) continue;
          const zTickPos = project([0, 0, zVal]);
          context.fillText(zVal.toFixed(1), zTickPos[0] + 15, zTickPos[1]);
      }
    }


    if (parsedFunc && !error) {
      // Sort polygons from back to front
      polygons.sort((a, b) => {
        const aProjected = project(a.points[0]);
        const bProjected = project(b.points[0]);
        return aProjected[1] - bProjected[1];
      });

      // Draw polygons
      polygons.forEach(poly => {
        const projectedPoints = poly.points.map(p => project(p));
        context.beginPath();
        context.moveTo(projectedPoints[0][0], projectedPoints[0][1]);
        context.lineTo(projectedPoints[1][0], projectedPoints[1][1]);
        context.lineTo(projectedPoints[2][0], projectedPoints[2][1]);
        context.lineTo(projectedPoints[3][0], projectedPoints[3][1]);
        context.closePath();
        
        context.fillStyle = poly.color;
        context.fill();
        context.strokeStyle = 'hsl(var(--background) / 0.3)';
        context.lineWidth = 0.5;
        context.stroke();
      });


      // Draw gradient field
      if (showGradient && gradFns) {
        context.strokeStyle = 'hsl(var(--destructive))';
        context.lineWidth = 1;
        const gradStep = 2; // draw fewer vectors than grid lines

        for (let x = -range; x <= range; x += gradStep) {
          for (let y = -range; y <= range; y += gradStep) {
            try {
              const z = parsedFunc.evaluate({x, y});
              if (!isFinite(z)) continue;
              
              const gradX = gradFns.fx.evaluate({x, y});
              const gradY = gradFns.fy.evaluate({x, y});

              // Normalize gradient for consistent arrow length
              const mag = Math.sqrt(gradX*gradX + gradY*gradY);
              const scale = 0.8;
              const dx = mag > 0 ? (gradX / mag) * scale : 0;
              const dy = mag > 0 ? (gradY / mag) * scale : 0;
              
              const startPoint: Point3D = [x, y, z];
              const endPoint: Point3D = [x + dx, y + dy, parsedFunc.evaluate({x: x + dx, y: y + dy})];

              const p1 = project(startPoint);
              const p2 = project(endPoint);
              
              context.beginPath();
              context.moveTo(p1[0], p1[1]);
              context.lineTo(p2[0], p2[1]);
              context.stroke();

            } catch (e) {
              // ignore points where gradient fails
            }
          }
        }
      }

    }

  }, [funcStr, parsedFunc, polygons, zRange, error, angles, zoom, showGradient, gradFns]);

  return (
    <div id="visualization-panel" className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Calculadora Gráfica 3D</CardTitle>
              <CardDescription className="font-code text-primary pt-1">
                z = {funcStr || 'Ninguna función definida'}
              </CardDescription>
            </div>
             <div className="flex items-center space-x-2">
                <Blend className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="gradient-switch">Ver Gradiente</Label>
                <Switch 
                  id="gradient-switch" 
                  checked={showGradient}
                  onCheckedChange={setShowGradient}
                  disabled={!gradFns}
                />
            </div>
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
