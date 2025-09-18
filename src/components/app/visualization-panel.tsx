'use client';

import React, { useMemo, useRef, Suspense, useEffect } from 'react';
import * as math from 'mathjs';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ZoomIn, ZoomOut, RotateCcw, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const GRID_SIZE = 50;

// Componente para la superficie de la función
function Surface({ func, domain }: { func: (x: number, y: number) => number; domain: [number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => {
    const [min, max] = domain;
    const size = max - min;
    const geometry = new THREE.PlaneGeometry(size, size, GRID_SIZE, GRID_SIZE);
    const positions = geometry.attributes.position.array as number[];

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] + (min + max) / 2;
      const y = positions[i + 1] + (min + max) / 2;
      try {
        const z = func(x, y);
        if (isFinite(z)) {
          positions[i + 2] = z;
        } else {
            positions[i+2] = 0; // O un valor neutro
        }
      } catch (e) {
        positions[i + 2] = 0; // O un valor neutro si la función falla
      }
    }

    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }, [func, domain]);

  return (
    <mesh ref={mesh} geometry={geometry}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

// Componente para los ejes y la grilla
function AxesHelper({ domain }: { domain: [number, number] }) {
  const { scene } = useThree();
  const max = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
  const size = max * 1.2;

  useEffect(() => {
    const axes = new THREE.AxesHelper(size);
    scene.add(axes);

    const grid = new THREE.GridHelper(size * 2, 20);
    grid.position.y = -0.01;
    scene.add(grid);

    return () => {
      scene.remove(axes);
      scene.remove(grid);
    };
  }, [scene, size]);

  return (
    <>
      <Text position={[size, 0, 0]} fontSize={size / 20} color="red">X</Text>
      <Text position={[0, size, 0]} fontSize={size / 20} color="green">Z</Text>
      <Text position={[0, 0, size]} fontSize={size / 20} color="blue">Y</Text>
    </>
  );
}


export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func: funcStr, domain } = state;

  const [func, error] = useMemo(() => {
    try {
      if (!funcStr) return [null, null];
      const compiled = math.parse(funcStr).compile();
      return [(x: number, y: number) => compiled.evaluate({ x, y }), null];
    } catch (e: any) {
      return [null, e.message || 'Función inválida'];
    }
  }, [funcStr]);

  const handleZoomIn = () => dispatch({ type: 'ZOOM_IN' });
  const handleZoomOut = () => dispatch({ type: 'ZOOM_OUT' });
  const handleResetZoom = () => dispatch({ type: 'RESET_ZOOM' });

  return (
    <div className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Visualización 3D</CardTitle>
              <CardDescription className="font-code text-primary pt-1">
                {funcStr || 'Ninguna función definida'}
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
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            {error ? (
              <Alert variant="destructive" className="max-w-md">
                <Frown className="h-4 w-4" />
                <AlertTitle>Error en la función</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : func ? (
              <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Surface func={func} domain={domain} />
                <AxesHelper domain={domain} />
                <OrbitControls />
              </Canvas>
            ) : (
             <div className="z-10 text-center text-muted-foreground p-4">
                <p className="text-lg font-medium">Gráfico 3D</p>
                <p className="text-sm mt-2">Introduce una función para ver su gráfica</p>
             </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
