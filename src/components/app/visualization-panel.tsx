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

const FunctionSurface = ({ func, domain }: { func: string; domain: [number, number] }) => {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null!);

  const { geometry, error } = useMemo(() => {
    if (!func) return { geometry: null, error: null };

    try {
      const compiledFunc = math.parse(func).compile();
      const segments = 100;
      const [min, max] = domain;

      const geometry = new THREE.PlaneGeometry(
        viewport.width,
        viewport.height,
        segments,
        segments
      );

      const positions = geometry.attributes.position.array as number[];
      for (let i = 0; i < positions.length; i += 3) {
        const x = (positions[i] / viewport.width) * (max - min) + (min + max) / 2;
        const y = (positions[i + 1] / viewport.height) * (max - min) + (min + max) / 2;
        
        try {
          const z = compiledFunc.evaluate({ x, y });
          if (isFinite(z)) {
            positions[i + 2] = z;
          } else {
            positions[i + 2] = 0; // O un valor neutro
          }
        } catch (e) {
          positions[i + 2] = 0; // Valor por defecto si la evaluación falla
        }
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      return { geometry, error: null };
    } catch (e: any) {
      return { geometry: null, error: `Función inválida: ${e.message}` };
    }
  }, [func, domain, viewport.width, viewport.height]);

  if (error) {
    return (
      <group>
        <Alert variant="destructive" className="w-auto z-10 absolute top-4 left-4">
          <Frown className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </group>
    );
  }

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial vertexColors={false} side={THREE.DoubleSide} color="hsl(var(--primary))" wireframe={false} />
    </mesh>
  );
};


const Axes = () => {
  const { viewport } = useThree();
  const length = Math.max(viewport.width, viewport.height) / 2;
  return (
    <group>
      {/* X axis (Red) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-length, 0, 0, length, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="red" />
      </line>
      <Text color="red" position={[length + 0.5, 0, 0]} fontSize={0.3}>
        X
      </Text>

      {/* Y axis (Green) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -length, 0, 0, length, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="green" />
      </line>
      <Text color="green" position={[0, length + 0.5, 0]} fontSize={0.3}>
        Z
      </Text>

      {/* Z axis (Blue) - Mapeado a Y en nuestro plano */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, -length, 0, 0, length])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="blue" />
      </line>
      <Text color="blue" position={[0, 0, length + 0.5]} fontSize={0.3} rotation={[-Math.PI / 2, 0, 0]}>
        Y
      </Text>
    </group>
  );
};


export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func, domain } = state;

  const handleZoomIn = () => dispatch({ type: 'ZOOM_IN' });
  const handleZoomOut = () => dispatch({ type: 'ZOOM_OUT' });
  const handleResetZoom = () => dispatch({ type: 'RESET_ZOOM' });

  const { error } = useMemo(() => {
    if (!func) return { error: null };
    try {
      math.parse(func).compile();
      return { error: null };
    } catch (e: any) {
      return { error: `Función inválida: ${e.message}` };
    }
  }, [func]);

  return (
    <div className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Visualización de la Función</CardTitle>
              <CardDescription className="font-code text-primary pt-1">
                {func || "Ninguna función definida"}
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
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <gridHelper args={[20, 20]} />
              <Axes />
              {func && !error && <FunctionSurface func={func} domain={domain} />}
              <OrbitControls />
            </Canvas>
          </Suspense>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Alert variant="destructive" className="w-auto">
                <Frown className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {!func && !error && (
             <div className="z-10 text-center text-muted-foreground p-4">
                <p className="text-lg font-medium">Gráfico 3D</p>
                <p className="text-sm mt-2">El gráfico de la función aparecerá aquí</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}