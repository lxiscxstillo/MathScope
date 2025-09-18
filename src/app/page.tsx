'use client';
import { ControlPanel } from '@/components/app/control-panel';
import { Header } from '@/components/app/header';
import { VisualizationPanel } from '@/components/app/visualization-panel';
import { AppStateProvider } from '@/hooks/use-app-state';

export default function Home() {
  return (
    <AppStateProvider>
      <div className="flex flex-col min-h-screen bg-background font-body">
        <Header />
        <main className="flex flex-1 overflow-hidden">
          <ControlPanel />
          <VisualizationPanel />
        </main>
      </div>
    </AppStateProvider>
  );
}
