'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FunctionInputSection } from '@/components/app/function-input-section';
import { IntegrationSection } from '@/components/app/integration-section';
import { OptimizationSection } from '@/components/app/optimization-section';
import { HistorySection } from '@/components/app/history-section';
import { FormulaExplainer } from '@/components/app/formula-explainer';
import { SlidersHorizontal, FunctionSquare, History, Waypoints, HelpCircle } from 'lucide-react';

export function ControlPanel() {
  return (
    <aside className="w-full max-w-md border-r border-border flex flex-col">
      <Tabs defaultValue="function" className="flex-1 flex flex-col">
        <TabsList className="m-2 grid w-auto grid-cols-5">
          <TabsTrigger value="function" className="h-auto py-2">
            <FunctionSquare className="w-5 h-5 mb-1" />
            <span className="text-xs">Función</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="h-auto py-2">
            <SlidersHorizontal className="w-5 h-5 mb-1" />
            <span className="text-xs">Integrales</span>
          </TabsTrigger>
          <TabsTrigger value="optimization" className="h-auto py-2">
            <Waypoints className="w-5 h-5 mb-1" />
            <span className="text-xs">Optimizar</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="h-auto py-2">
            <History className="w-5 h-5 mb-1" />
            <span className="text-xs">Historial</span>
          </TabsTrigger>
          <TabsTrigger value="explain" className="h-auto py-2">
            <HelpCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Explicar</span>
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <div className="p-4 pt-0">
            <TabsContent value="function">
              <FunctionInputSection />
            </TabsContent>
            <TabsContent value="integration">
              <IntegrationSection />
            </TabsContent>
            <TabsContent value="optimization">
              <OptimizationSection />
            </TabsContent>
            <TabsContent value="history">
              <HistorySection />
            </TabsContent>
            <TabsContent value="explain">
              <FormulaExplainer />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
