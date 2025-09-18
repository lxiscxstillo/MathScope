'use client';
import React, { useMemo } from 'react';
import Image from 'next/image';

import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Frown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VisualizationPanel() {
  const { state, dispatch } = useAppState();
  const { func: funcStr } = state;

  const handleZoomIn = () => {};
  const handleZoomOut = () => {};
  const handleResetZoom = () => {};

  const { error } = useMemo(() => {
    if (!funcStr) return { error: null };
    // Basic validation placeholder
    try {
      // A very simple check
      if (funcStr.includes('**')) throw new Error("Usa '^' para potencias en lugar de '**'.");
      return { error: null };
    } catch (e: any) {
      return { error: `Función inválida: ${e.message}` };
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
            <Image
              src="https://picsum.photos/seed/graph/800/600"
              alt="Marcador de posición para gráfico 3D"
              fill
              className="object-cover"
              data-ai-hint="3d math graph"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
