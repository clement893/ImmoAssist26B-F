/**
 * Performance Profiler Component
 * Affiche les résultats du profiling de performance
 */
'use client';

import { useEffect, useState } from 'react';
import { profiler } from '@/lib/monitoring/profiler';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function PerformanceProfiler() {
  const [profiles, setProfiles] = useState<Record<string, number>>({});
  const [isProfiling, setIsProfiling] = useState(false);

  useEffect(() => {
    const updateProfiles = () => {
      const currentProfiles = profiler.getProfiles();
      setProfiles(currentProfiles);
    };

    updateProfiles();
    const interval = setInterval(updateProfiles, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartProfiling = () => {
    setIsProfiling(true);
    profiler.start('custom-operation'); // Simuler une opération
    setTimeout(() => {
      profiler.end('custom-operation');
      setIsProfiling(false);
    }, 2000);
  };

  const handleClearProfiles = () => {
    profiler.clearProfiles();
    setProfiles({});
  };

  const getDurationColor = (duration: number): string => {
    if (duration > 3000) return 'text-error-600 dark:text-error-400';
    if (duration > 1000) return 'text-warning-600 dark:text-warning-400';
    return 'text-success-600 dark:text-success-400';
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Performance Profiler</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartProfiling}
              disabled={isProfiling}
            >
              {isProfiling ? 'Profiling...' : 'Start Profiling'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearProfiles}>
              Clear
            </Button>
          </div>
        </div>

        {Object.keys(profiles).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No profiling data available. Start profiling to see results.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(profiles)
              .sort(([, a], [, b]) => b - a)
              .map(([name, duration]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{name}</Badge>
                    <span
                      className={`font-mono font-semibold ${getDurationColor(duration)}`}
                    >
                      {duration.toFixed(2)}ms
                    </span>
                  </div>
                  {duration > 1000 && <Badge variant="warning">Slow</Badge>}
                  {duration > 3000 && <Badge variant="error">Critical</Badge>}
                </div>
              ))}
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            Profiling helps identify performance bottlenecks in your
            application.
          </p>
        </div>
      </div>
    </Card>
  );
}
