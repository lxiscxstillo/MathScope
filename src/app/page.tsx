'use client';
import { ControlPanel } from '@/components/app/control-panel';
import { Header } from '@/components/app/header';
import { AppStateProvider } from '@/hooks/use-app-state';
import { VisualizationPanel } from '@/components/app/visualization-panel';
import { VisualizationPanel3D } from '@/components/app/visualization-panel-3d';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('function');
  const [func3D, setFunc3D] = useState('sin(sqrt(x^2 + y^2)) / sqrt(x^2 + y^2)');

  return (
    <AppStateProvider>
      <div className="flex flex-col h-screen bg-background font-body">
        <Header />
        <main className="flex flex-1 overflow-hidden">
          <ControlPanel 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setFunc3D={setFunc3D}
          />
          {activeTab === 'function-3d' ? (
            <VisualizationPanel3D funcStr={func3D} />
          ) : (
            <VisualizationPanel />
          )}
        </main>
      </div>
    </AppStateProvider>
  );
}
