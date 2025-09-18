'use client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Cube } from '@/components/icons';
import { PlayCircle, Download } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';

export function Header() {
  const { dispatch } = useAppState();

  const handleDemoMode = () => {
    console.log('Entering Demo Mode');
    dispatch({ type: 'SET_FUNCTION', payload: 'x^2 * exp(-x^2 - y^2)' });
    dispatch({ type: 'SET_GUIDED_MODE', payload: true });
    // In a real app, this would also set graph parameters, etc.
  };

  const handleExport = () => {
    // This would trigger PDF/PNG export logic
    console.log('Exporting results...');
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
          Demo Mode
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </header>
  );
}
