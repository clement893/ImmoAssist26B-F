'use client';
import { clsx } from 'clsx';
import { chartColors } from '@/lib/theme/colors';
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}
export interface ChartProps {
  data: ChartDataPoint[];
  type?: 'bar' | 'line' | 'pie' | 'area';
  title?: string;
  height?: number;
  className?: string;
}
export default function Chart({ data, type = 'bar', title, height = 300, className }: ChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const renderBarChart = () => {
    return (
      <div className="flex items-end justify-between gap-2 h-full">
        {' '}
        {data.map((point, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            {' '}
            <div
              className={clsx(
                'w-full rounded-t transition-modern hover:opacity-80', // UI Revamp - Transition moderne
                point.color || 'bg-primary-500 dark:bg-primary-400'
              )}
              style={{ height: `${(point.value / maxValue) * 100}%`, backgroundColor: point.color }}
              title={`${point.label}: ${point.value}`}
            />{' '}
            <div className="text-xs text-muted-foreground mt-2 text-center truncate w-full">
              {' '}
              {point.label}{' '}
            </div>{' '}
          </div>
        ))}{' '}
      </div>
    );
  };
  const renderLineChart = () => {
    const points = data.map((point, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - (point.value / maxValue) * 100,
      value: point.value,
      label: point.label,
    }));
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {' '}
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join('')}
          fill="none"
          stroke={data[0]?.color || chartColors.default()}
          strokeWidth="2"
        />{' '}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={data[index]?.color || chartColors.default()}
          />
        ))}{' '}
      </svg>
    );
  };
  const renderPieChart = () => {
    let currentAngle = -90;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {' '}
        {data.map((point, index) => {
          const percentage = (point.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const largeArcFlag = angle > 180 ? 1 : 0;
          const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
          const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
          const pathData = [
            `M 50 50`,
            `L ${x1} ${y1}`,
            `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z',
          ].join('');
          currentAngle += angle;
          return (
            <path
              key={index}
              d={pathData}
              fill={point.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`}
            >
              {' '}
              <title>{`${point.label}: ${point.value}`}</title>{' '}
            </path>
          );
        })}{' '}
      </svg>
    );
  };
  const renderAreaChart = () => {
    const points = data.map((point, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - (point.value / maxValue) * 100,
      value: point.value,
      label: point.label,
    }));
    const pathData = [
      `M 0 100`,
      ...points.map((point) => `L ${point.x} ${point.y}`),
      `L 100 100`,
      'Z',
    ].join('');
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {' '}
        <path d={pathData} fill={data[0]?.color || chartColors.default()} opacity="0.3" />{' '}
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join('')}
          fill="none"
          stroke={data[0]?.color || chartColors.default()}
          strokeWidth="2"
        />{' '}
      </svg>
    );
  };
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  };
  return (
    <div className={clsx('bg-background rounded-lg border border-border p-6', className)}>
      {' '}
      {title && <h3 className="text-lg font-semibold text-foreground mb-4"> {title} </h3>}{' '}
      <div style={{ height: `${height}px` }} className="relative">
        {' '}
        {renderChart()}{' '}
      </div>{' '}
      {type === 'pie' && (
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {' '}
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              {' '}
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: point.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`,
                }}
              />{' '}
              <span className="text-sm text-muted-foreground">
                {' '}
                {point.label}: {point.value}{' '}
              </span>{' '}
            </div>
          ))}{' '}
        </div>
      )}{' '}
    </div>
  );
}
