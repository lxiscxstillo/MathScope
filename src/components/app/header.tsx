'use client';
import { Button } from '@/components/ui/button';
import { Cube } from '@/components/icons';
import { PlayCircle, Download } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

export function Header() {
  const { dispatch } = useAppState();
  const { toast } = useToast();

  const handleDemoMode = () => {
    const demoFunc = 'sin(x) / x';
    dispatch({ type: 'SET_FUNCTION', payload: demoFunc });
    
    toast({
      title: 'Modo Demo Activado',
      description: `Se ha cargado la función de ejemplo: ${demoFunc}`,
    });
  };

  const handleExport = () => {
    const visualizationPanel = document.getElementById('visualization-panel');
    if (visualizationPanel) {
      toast({
        title: 'Exportando...',
        description: 'Se está generando la imagen de la visualización.',
      });
      html2canvas(visualizationPanel, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: 'hsl(var(--background))',
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'multicalc-pro.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
         toast({
          title: 'Exportación Completa',
          description: 'La imagen ha sido descargada.',
        });
      }).catch(err => {
        console.error('Error al exportar:', err);
        toast({
          variant: 'destructive',
          title: 'Error de Exportación',
          description: 'No se pudo generar la imagen. Intenta de nuevo.',
        });
      });
    } else {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se encontró el panel de visualización para exportar.',
      });
    }
  };
  
  return (
    <header className="flex items-center h-16 px-4 md:px-6 border-b shrink-0 bg-card">
      <div className="flex items-center gap-3">
        <Cube className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">
          MultiCalc Pro
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDemoMode}>
          <PlayCircle className="mr-2 h-4 w-4" />
          Ejemplo
        </Button>
        <Button variant="default" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar PNG
        </Button>
      </div>
    </header>
  );
}
