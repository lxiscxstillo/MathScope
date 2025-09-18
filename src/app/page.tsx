'use client';
import { ControlPanel } from '@/components/app/control-panel';
import { Header } from '@/components/app/header';
import { AppStateProvider } from '@/hooks/use-app-state';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Carga dinámica del panel de visualización para evitar conflictos de SSR con librerías 3D
const VisualizationPanel = dynamic(
  () => import('@/components/app/visualization-panel').then((mod) => mod.VisualizationPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col p-4 bg-muted/30 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando visualización 3D...</p>
        </div>
      </div>
    ),
  }
);

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
