'use client';

import React from 'react';
import Image from 'next/image';
import { useAppState } from '@/hooks/use-app-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function VisualizationPanel() {
  const { state } = useAppState();
  const { func: funcStr } = state;
  const { toast } = useToast();

  const handleNotImplemented = () => {
    toast({
      title: 'Función no implementada',
      description: 'La visualización interactiva está temporalmente deshabilitada.',
      variant: 'destructive',
    });
  };

  return (
    <div id="visualization-panel" className="flex-1 flex flex-col p-4 bg-muted/30">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Visualización 2D</CardTitle>
              <CardDescription className="font-code text-primary pt-1">
                {funcStr || 'Ninguna función definida'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleNotImplemented} title="Acercar">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNotImplemented} title="Alejar">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNotImplemented} title="Restablecer Vista">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center relative bg-background rounded-b-lg overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="https://picsum.photos/seed/graph2d/1200/800"
              alt="Visualización 2D de una función matemática"
              fill
              className="object-cover"
              data-ai-hint="2d graph"
              priority
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center p-4 bg-black/50 rounded-lg">
                <h3 className="text-white font-bold text-lg">Visualización Interactiva Deshabilitada</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Se muestra una imagen estática para evitar errores.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
