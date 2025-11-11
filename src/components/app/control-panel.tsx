'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { FunctionInputSection } from '@/components/app/function-input-section';
import { Function3DSection } from '@/components/app/function-3d-section';
import { IntegrationSection } from '@/components/app/integration-section';
import { OptimizationSection } from '@/components/app/optimization-section';
import { HistorySection } from '@/components/app/history-section';
import { SlidersHorizontal, FunctionSquare, History, Waypoints } from 'lucide-react';
import { Plot3d } from '../icons';
import * as math from 'mathjs';

type ControlPanelProps = {
  activeTab: string;
  setActiveTab: (value: string) => void;
  setFunc3D: (value: { str: string; gradFns: { fx: math.EvalFunction; fy: math.EvalFunction; } | null; }) => void;
};


export function ControlPanel({ activeTab, setActiveTab, setFunc3D }: ControlPanelProps) {
  return (
    <aside className="w-full max-w-md border-r border-border flex flex-col bg-card">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="m-2 grid w-auto grid-cols-5 shrink-0 bg-secondary/50">
          <TabsTrigger value="function" className="h-auto py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col items-center gap-1">
            <FunctionSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Función</span>
          </TabsTrigger>
          <TabsTrigger value="function-3d" className="h-auto py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col items-center gap-1">
            <Plot3d className="w-5 h-5" />
            <span className="text-xs font-medium">Función 3D</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="h-auto py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col items-center gap-1">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-xs font-medium">Integrales</span>
          </TabsTrigger>
          <TabsTrigger value="optimization" className="h-auto py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col items-center gap-1">
            <Waypoints className="w-5 h-5" />
            <span className="text-xs font-medium">Optimizar</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="h-auto py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex flex-col items-center gap-1">
            <History className="w-5 h-5" />
            <span className="text-xs font-medium">Historial</span>
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
          </div>
        </div>
      </Tabs>
    </aside>
  );
}
