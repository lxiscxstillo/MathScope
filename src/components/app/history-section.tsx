'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { AppState } from '@/hooks/use-app-state';
import { useAppState } from '@/hooks/use-app-state';

export function HistorySection() {
  const [history, setHistory] = useLocalStorage<AppState[]>('multicalc-history', []);
  const { dispatch } = useAppState();

  const loadState = (state: AppState) => {
    dispatch({ type: 'LOAD_STATE', payload: state });
  };

  const deleteItem = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
  };
  
  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <Card className="fade-in">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Historial de Cálculos</CardTitle>
            <CardDescription>Revisa y restaura sesiones anteriores.</CardDescription>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 space-y-2">
              <History className="h-12 w-12 text-primary/30" />
              <p className="font-medium">No hay historial.</p>
              <p className="text-sm">Tus cálculos se guardarán aquí automáticamente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg flex justify-between items-center bg-secondary/30 hover:bg-secondary/70 transition-colors duration-200">
                  <div className="truncate">
                    <p className="font-medium font-code truncate text-sm">f(x) = {item.func}</p>
                    <p className="text-xs text-muted-foreground">
                      Guardado: {new Date(item.lastSaved || Date.now()).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadState(item)} title="Restaurar">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteItem(index)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
