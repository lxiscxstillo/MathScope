'use client';
import React, { useMemo } from 'react';
import Image from 'next/image';
import * as math from 'mathjs';

import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Frown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';


export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func } = state;

  // Los controles de zoom ya no afectan a la imagen estática, pero los dejamos para futura implementación.
  const handleZoomIn = () => console.log('Zoom in');
  const handleZoomOut = () => console.log('Zoom out');
  const handleResetZoom = () => console.log('Reset zoom');

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
        <CardContent className="flex-1 flex items-center justify-center relative">
          {error && (
            <Alert variant="destructive" className="w-auto z-10">
              <Frown className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!func && !error && (
             <div className="z-10 text-center text-muted-foreground p-4">
                <p className="text-lg font-medium">Gráfico</p>
                <p className="text-sm mt-2">El gráfico de la función aparecerá aquí</p>
            </div>
          )}

          {!error && func && (
             <div className="w-full h-full relative">
                <Image 
                    src="https://picsum.photos/seed/graph/800/600" 
                    alt="Gráfico de función (temporal)"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                    data-ai-hint="math graph"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <p className="text-white text-center text-lg p-4">La visualización 3D está en desarrollo. <br/> Esta es una imagen temporal.</p>
                </div>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
