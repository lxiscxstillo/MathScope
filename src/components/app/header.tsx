'use client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Cube } from '@/components/icons';
import { PlayCircle, Download } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';

export function Header() {
  const { dispatch } = useAppState();

  const handleDemoMode = () => {
    console.log('Activando Modo Demo');
    dispatch({ type: 'SET_FUNCTION', payload: 'x^2 * exp(-x^2 - y^2)' });
    dispatch({ type: 'SET_GUIDED_MODE', payload: true });
    // En una app real, esto también ajustaría parámetros del gráfico, etc.
  };

  const handleExport = () => {
    // Esto activaría la lógica para exportar a PDF/PNG
    console.log('Exportando resultados...');
  };
  
  return (
    <header className="flex items-center h-16 px-4 border-b shrink-0">
      <div className="flex items-center gap-2">
        <Cube className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight font-headline">
          MultiCalc Pro
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDemoMode}>
          <PlayCircle className="mr-2 h-4 w-4" />
          Modo Demo
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>
    </header>
  );
}
