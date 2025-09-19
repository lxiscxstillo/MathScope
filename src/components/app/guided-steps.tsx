'use client';
import 'katex/dist/katex.min.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import { BlockMath, InlineMath } from 'react-katex';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';

// Componente para renderizar Markdown con soporte para LaTeX
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      components={{
        p: ({ node, ...props }) => <p className="mb-4 text-sm text-muted-foreground" {...props} />,
        h3: ({ node, ...props }) => <h3 className="font-semibold text-primary mb-2" {...props} />,
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          if (inline) {
            return <InlineMath math={String(children)} />;
          }
          return <div className="my-4 text-center"><BlockMath math={String(children)} /></div>;
        },
        // Añadir más renderizadores si es necesario para otros elementos de Markdown
      }}
    >
      {content}
    </ReactMarkdown>
  );
}


export function GuidedSteps({ isLoading }: { isLoading: boolean }) {
  const { state } = useAppState();
  const { analysisResult } = state;

  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg">Derivación Paso a Paso</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}
        {analysisResult?.calculationSteps && !isLoading && (
           <ScrollArea className="h-96 w-full pr-4">
            <div className="space-y-6 p-4 bg-background rounded-lg shadow-sm">
              <MarkdownRenderer content={analysisResult.calculationSteps} />
            </div>
           </ScrollArea>
        )}
        {!analysisResult && !isLoading && (
          <p className="text-sm text-muted-foreground text-center p-4">
            Activa el modo guiado y calcula una función para ver los pasos aquí.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
