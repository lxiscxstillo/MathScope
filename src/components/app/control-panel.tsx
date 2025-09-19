'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FunctionInputSection } from '@/components/app/function-input-section';
import { Function3DSection } from '@/components/app/function-3d-section';
import { IntegrationSection } from '@/components/app/integration-section';
import { OptimizationSection } from '@/components/app/optimization-section';
import { HistorySection } from '@/components/app/history-section';
import { FormulaExplainer } from '@/components/app/formula-explainer';
import { SlidersHorizontal, FunctionSquare, History, Waypoints, HelpCircle } from 'lucide-react';
import { Plot3d } from '../icons';

type ControlPanelProps = {
  activeTab: string;
  setActiveTab: (value: string) => void;
  setFunc3D: (value: string) => void;
};


export function ControlPanel({ activeTab, setActiveTab, setFunc3D }: ControlPanelProps) {
  return (
    <aside className="w-full max-w-md border-r border-border flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="m-2 grid w-auto grid-cols-6 shrink-0">
          <TabsTrigger value="function" className="h-auto py-2">
            <FunctionSquare className="w-5 h-5 mb-1" />
            <span className="text-xs">Función</span>
          </TabsTrigger>
          <TabsTrigger value="function-3d" className="h-auto py-2">
            <Plot3d className="w-5 h-5 mb-1" />
            <span className="text-xs">Función 3D</span>
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pt-0">
            <TabsContent value="function">
              <FunctionInputSection />
            </TabsContent>
            <TabsContent value="function-3d">
              <Function3DSection setFunc3D={setFunc3D} />
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
        </div>
      </Tabs>
    </aside>
  );
}
