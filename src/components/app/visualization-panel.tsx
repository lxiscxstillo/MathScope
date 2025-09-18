'use client';
import React, { useMemo, useRef, Suspense } from 'react';
import * as math from 'mathjs';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Frown, ZoomIn, ZoomOut, RotateCcw, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Componente para mostrar un indicador de carga
const LoadingIndicator = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <Loader className="w-8 h-8 animate-spin" />
      <p>Generando gráfico 3D...</p>
    </div>
  </div>
);

// Componente para mostrar cuando no hay función
const EmptyState = () => (
  <div className="z-10 text-center text-muted-foreground p-4">
    <p className="text-lg font-medium">Gráfico 3D</p>
    <p className="text-sm mt-2">El gráfico de la función aparecerá aquí</p>
  </div>
);

// Componente de la superficie de la función
function FunctionSurface({ func, domain }: { func: math.EvalFunction; domain: [number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const segments = 60;
  const [xMin, xMax] = domain;
  const [yMin, yMax] = domain;

  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(xMax - xMin, yMax - yMin, segments, segments);
    const positions = geom.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + (xMin + xMax) / 2;
      const y = positions.getY(i) + (yMin + yMax) / 2;
      try {
        let z = func.evaluate({ x, y });
        if (typeof z !== 'number' || !isFinite(z)) {
          z = 0; // Si el resultado no es un número válido, poner en z=0
        }
         // Limitar Z para evitar picos extremos
        z = Math.max(-10, Math.min(10, z));
        positions.setZ(i, z);
      } catch {
        positions.setZ(i, 0); // En caso de error en la evaluación
      }
    }
    
    geom.computeVertexNormals();
    return geom;
  }, [func, xMin, xMax, yMin, yMax]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="hsl(var(--primary))"
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
}

// Componente para los ejes y la grilla
function AxesAndGrid({ domain }: { domain: [number, number] }) {
  const size = Math.max(Math.abs(domain[0]), Math.abs(domain[1])) * 1.1;
  const divisions = 10;
  
  return (
    <>
      <gridHelper args={[size * 2, divisions]} rotation-x={Math.PI / 2} position-z={-0.01}/>
      <axesHelper args={[size]} />
       <Text position={[size, 0, 0]} fontSize={0.5} color="black" anchorX="center" anchorY="middle">X</Text>
       <Text position={[0, size, 0]} fontSize={0.5} color="black" anchorX="center" anchorY="middle">Y</Text>
       <Text position={[0, 0, size]} fontSize={0.5} color="black" anchorX="center" anchorY="middle">Z</Text>
    </>
  );
}


export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func: funcStr, domain } = state;
  
  const handleZoomIn = () => dispatch({ type: 'ZOOM_IN' });
  const handleZoomOut = () => dispatch({ type: 'ZOOM_OUT' });
  const handleResetZoom = () => dispatch({ type: 'RESET_ZOOM' });

  const { compiledFunc, error } = useMemo(() => {
    if (!funcStr) return { compiledFunc: null, error: null };
    try {
      const node = math.parse(funcStr);
      return { compiledFunc: node.compile(), error: null };
    } catch (e: any) {
      return { compiledFunc: null, error: `Función inválida: ${e.message}` };
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

          {!funcStr && !error && <EmptyState />}
          
          {compiledFunc && !error && (
            <Suspense fallback={<LoadingIndicator />}>
              <Canvas
                camera={{ position: [5, 5, 8], fov: 50 }}
                className="w-full h-full"
              >
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <FunctionSurface func={compiledFunc} domain={domain} />
                <AxesAndGrid domain={domain} />
                <OrbitControls />
              </Canvas>
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}