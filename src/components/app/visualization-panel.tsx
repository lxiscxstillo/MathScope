'use client';

import React, { useMemo, useRef, Suspense, useEffect } from 'react';
import * as math from 'mathjs';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Frown, ZoomIn, ZoomOut, RotateCcw, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const SEGMENTS = 80;

const FunctionSurface = ({ func, domain }: { func: math.EvalFunction, domain: [number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { invalidate } = useThree();

  const geometry = useMemo(() => {
    const planeGeom = new THREE.PlaneGeometry(
      domain[1] - domain[0],
      domain[1] - domain[0],
      SEGMENTS,
      SEGMENTS
    );
    const positions = planeGeom.attributes.position;
    const colors = [];
    const minZ = -1;
    const maxZ = 1;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      let z = 0;
      try {
        z = func.evaluate({ x, y });
        if (isNaN(z) || !isFinite(z)) z = 0;
      } catch {
        z = 0;
      }
      positions.setZ(i, z);

      // Color mapping
      const normalizedZ = (z - minZ) / (maxZ - minZ);
      const color = new THREE.Color();
      color.setHSL(0.6 - normalizedZ * 0.5, 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }
    
    positions.needsUpdate = true;
    planeGeom.computeVertexNormals();
    planeGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return planeGeom;
  }, [func, domain]);

  useEffect(() => {
    invalidate();
  }, [geometry, invalidate]);

  return (
    <mesh ref={meshRef} geometry={geometry} material-vertex-colors>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
};

const GridAndAxes = ({ domain }: { domain: [number, number] }) => {
  const size = Math.max(...domain.map(Math.abs)) * 2;
  const divisions = 10;
  return (
    <>
      <gridHelper args={[size, divisions]} rotation={[Math.PI / 2, 0, 0]} />
      <axesHelper args={[size/2]} />
       <Text
        position={[size / 2 + 0.5, 0, 0]}
        fontSize={0.5}
        color="black"
        anchorX="left"
      >
        X
      </Text>
      <Text
        position={[0, size / 2 + 0.5, 0]}
        fontSize={0.5}
        color="black"
        anchorX="left"
      >
        Y
      </Text>
       <Text
        position={[0, 0, size / 2 + 0.5]}
        fontSize={0.5}
        color="black"
        anchorX="left"
      >
        Z
      </Text>
    </>
  );
};


const GraphScene = () => {
    const { state } = useAppState();
    const { func: funcStr, domain } = state;

    const [compiledFunc, error] = useMemo(() => {
        if (!funcStr) return [null, null];
        try {
            const node = math.parse(funcStr);
            return [node.compile(), null];
        } catch (e: any) {
            return [null, e.message];
        }
    }, [funcStr]);

    if (error) {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <Alert variant="destructive" className="w-auto">
                    <Frown className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!compiledFunc) {
      return (
        <div className="z-10 text-center text-muted-foreground p-4">
          <p className="text-lg font-medium">Gráfico 3D</p>
          <p className="text-sm mt-2">El gráfico de la función aparecerá aquí</p>
        </div>
      );
    }

    return (
        <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} />
                <FunctionSurface func={compiledFunc} domain={domain} />
                <GridAndAxes domain={domain} />
                <OrbitControls />
            </Canvas>
        </Suspense>
    );
};


export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func: funcStr } = state;

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
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <GraphScene />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}