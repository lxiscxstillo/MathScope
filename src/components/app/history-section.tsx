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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Calculation History</CardTitle>
            <CardDescription>Review and restore previous sessions.</CardDescription>
          </div>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearHistory}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <History className="h-12 w-12 mb-4" />
              <p>No history yet.</p>
              <p className="text-sm">Your calculations will be saved here automatically.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={index} className="p-3 border rounded-md flex justify-between items-center bg-background hover:bg-secondary/50 transition-colors">
                  <div className="truncate">
                    <p className="font-medium font-code truncate text-sm">f(x) = {item.func}</p>
                    <p className="text-xs text-muted-foreground">
                      Saved: {new Date(item.lastSaved || Date.now()).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadState(item)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteItem(index)}>
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
