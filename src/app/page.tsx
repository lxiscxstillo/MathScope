'use client';
import { ControlPanel } from '@/components/app/control-panel';
import { Header } from '@/components/app/header';
import { AppStateProvider } from '@/hooks/use-app-state';
import { VisualizationPanel } from '@/components/app/visualization-panel';

export default function Home() {
  return (
    <AppStateProvider>
      <div className="flex flex-col h-screen bg-background font-body">
        <Header />
        <main className="flex flex-1 overflow-hidden">
          <ControlPanel />
          <VisualizationPanel />
        </main>
      </div>
    </AppStateProvider>
  );
}
