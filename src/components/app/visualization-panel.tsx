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


// --- 3D Plotting Components ---

const FunctionSurface = ({ func, domain }: { func: string, domain: [number, number] }) => {
  const geometry = useMemo(() => {
    let node;
    try {
      node = math.parse(func);
      node.compile().evaluate({ x: 1, y: 1 });
    } catch (e) {
      return null;
    }

    const resolution = 50;
    const size = domain[1] - domain[0];
    const planeGeometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
    const positions = planeGeometry.attributes.position;

    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + (domain[0] + domain[1]) / 2;
      const y = positions.getY(i) + (domain[0] + domain[1]) / 2;
      try {
        const z = node.compile().evaluate({ x, y });
        if (typeof z === 'number' && isFinite(z)) {
          positions.setZ(i, z);
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        } else {
            positions.setZ(i, 0);
        }
      } catch (e) {
         positions.setZ(i, 0);
      }
    }

    planeGeometry.computeVertexNormals();
    positions.needsUpdate = true;
    
    // Normalize z-values for color mapping
    const rangeZ = maxZ - minZ;
    const colors = [];
    if (isFinite(minZ) && isFinite(maxZ) && rangeZ > 0) {
      for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        const normalizedZ = (z - minZ) / rangeZ;
        const color = new THREE.Color().setHSL(0.7 - normalizedZ * 0.7, 1, 0.5);
        colors.push(color.r, color.g, color.b);
      }
      planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }


    return planeGeometry;
  }, [func, domain]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors={true} side={THREE.DoubleSide} />
    </mesh>
  );
};

const Axes = ({ size }: { size: number }) => {
    return (
        <group>
            {/* X-axis */}
            <line>
                <bufferGeometry attach="geometry">
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([-size/2, 0, 0, size/2, 0, 0])}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial attach="material" color="red" />
            </line>
            <Text position={[size/2 + 0.5, 0, 0]} fontSize={0.5} color="red">X</Text>
            
            {/* Y-axis */}
            <line>
                <bufferGeometry attach="geometry">
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([0, -size/2, 0, 0, size/2, 0])}
                        itemSize={3}
                    />
                </bufferGeometry>
                 <lineBasicMaterial attach="material" color="green" />
            </line>
            <Text position={[0, size/2 + 0.5, 0]} fontSize={0.5} color="green">Y</Text>
            
            {/* Z-axis */}
             <line>
                <bufferGeometry attach="geometry">
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([0, 0, -size/2, 0, 0, size/2])}
                        itemSize={3}
                    />
                </bufferGeometry>
                 <lineBasicMaterial attach="material" color="blue" />
            </line>
             <Text position={[0, 0, size/2 + 0.5]} fontSize={0.5} color="blue">Z</Text>
        </group>
    );
};

const GridPlane = ({size} : {size: number}) => {
    return (
         <gridHelper args={[size, 10, '#888', '#888']} rotation={[Math.PI / 2, 0, 0]} />
    )
}

function SceneSetup() {
  const { camera } = useThree();
  
  React.useEffect(() => {
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

// --- Main Visualization Panel ---

export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func, domain } = state;

  const handleZoomIn = () => dispatch({ type: 'ZOOM_IN' });
  const handleZoomOut = () => dispatch({ type: 'ZOOM_OUT' });
  const handleResetZoom = () => dispatch({ type: 'RESET_ZOOM' });

  const { error } = useMemo(() => {
    if (!func) return { error: null };
    try {
      math.parse(func).compile().evaluate({ x: 1, y: 1 });
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
              <CardTitle>Visualización 3D de la Función</CardTitle>
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
        <CardContent className="flex-1 flex items-center justify-center relative">
          {error && (
            <Alert variant="destructive" className="w-auto z-10">
              <Frown className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!func && !error && (
             <div className="z-10 text-center text-muted-foreground p-4">
                <p className="text-lg font-medium">Gráfico 3D</p>
                <p className="text-sm mt-2">El gráfico de la función aparecerá aquí</p>
            </div>
          )}

          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <Canvas className="bg-background">
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <SceneSetup />
                {!error && func && (
                    <>
                        <FunctionSurface func={func} domain={domain} />
                        <GridPlane size={domain[1] - domain[0]} />
                    </>
                )}
                 <Axes size={domain[1] - domain[0]} />
                <OrbitControls />
            </Canvas>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
