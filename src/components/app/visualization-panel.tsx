'use client';
import React, { useMemo, useRef, Suspense } from 'react';
import * as math from 'mathjs';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Frown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FunctionSurface = ({ func, domain }: { func: (x: number, y: number) => number; domain: [number, number] }) => {
  const geometry = useMemo(() => {
    const size = 100; // Resolution of the grid
    const [min, max] = domain;
    const range = max - min;
    const step = range / size;
    const points = [];

    for (let i = 0; i <= size; i++) {
      const x = min + i * step;
      for (let j = 0; j <= size; j++) {
        const y = min + j * step;
        let z = func(x, y);

        // Clamp z value to prevent extreme peaks and visual artifacts
        z = Math.max(-10, Math.min(10, z));

        if (isNaN(z) || !isFinite(z)) {
          z = 0; // Default to 0 for invalid calculations
        }
        points.push(new THREE.Vector3(x, z, -y)); // Match coordinate system (Y-up)
      }
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const indices = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const a = i * (size + 1) + j;
        const b = a + (size + 1);
        const c = a + 1;
        const d = b + 1;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, [func, domain]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="hsl(var(--primary))"
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
};

const Axes = ({ size = 10 }) => (
  <>
    {/* X axis (Red) */}
    <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), size, 0xff0000]} />
    <Text color="red" position={[size + 0.5, 0, 0]} fontSize={0.5}>X</Text>
    {/* Y axis (Green) - Represents Z in math */}
    <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), size, 0x00ff00]} />
    <Text color="green" position={[0, size + 0.5, 0]} fontSize={0.5}>Z</Text>
    {/* Z axis (Blue) - Represents Y in math */}
    <arrowHelper args={[new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), size, 0x0000ff]} />
    <Text color="blue" position={[0, 0, -size - 0.5]} fontSize={0.5}>Y</Text>
  </>
);

const Grid = ({ size = 20, divisions = 20 }) => (
    <gridHelper args={[size, divisions]} rotation-x={Math.PI / 2} />
);

export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func: funcStr, domain } = state;

  const handleZoomIn = () => dispatch({ type: 'ZOOM_IN' });
  const handleZoomOut = () => dispatch({ type: 'ZOOM_OUT' });
  const handleResetZoom = () => dispatch({ type: 'RESET_ZOOM' });

  const { func, error } = useMemo(() => {
    if (!funcStr) return { func: () => 0, error: null };
    try {
      const node = math.parse(funcStr);
      const code = node.compile();
      const func = (x: number, y: number) => code.evaluate({ x, y });
      // Test with a sample point
      func(1, 1);
      return { func, error: null };
    } catch (e: any) {
      return { func: () => 0, error: `Función inválida: ${e.message}` };
    }
  }, [funcStr]);

  return (
    <div className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Visualización 3D de la Función</CardTitle>
              <CardDescription className="font-code text-primary pt-1">
                {funcStr || "Ninguna función definida"}
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
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Alert variant="destructive" className="w-auto">
                <Frown className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {!funcStr && !error && (
             <div className="z-10 text-center text-muted-foreground p-4">
                <p className="text-lg font-medium">Gráfico 3D</p>
                <p className="text-sm mt-2">El gráfico de la función aparecerá aquí</p>
            </div>
          )}
          
          {funcStr && !error && (
             <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <Canvas camera={{ position: [15, 12, 15], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 15, 10]} intensity={1} />
                <FunctionSurface func={func} domain={domain} />
                <Axes size={domain[1]}/>
                <Grid size={domain[1] * 2} divisions={domain[1] * 2} />
                <OrbitControls enableDamping dampingFactor={0.1} rotateSpeed={0.5} />
              </Canvas>
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}