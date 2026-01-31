'use client';

import { clsx } from 'clsx';
import { chartColors } from '@/lib/theme/colors';

export interface ScatterDataPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface RadarDataPoint {
  label: string;
  value: number;
  maxValue?: number;
}

export interface AdvancedChartProps {
  data: ScatterDataPoint[] | RadarDataPoint[] | { label: string; value: number; color?: string }[];
  type: 'scatter' | 'radar' | 'donut' | 'gauge';
  title?: string;
  height?: number;
  className?: string;
  // For gauge chart
  min?: number;
  max?: number;
  value?: number;
  // For donut chart
  innerRadius?: number;
}

export default function AdvancedCharts({
  data,
  type,
  title,
  height = 300,
  className,
  min = 0,
  max = 100,
  value = 50,
  innerRadius = 0.6,
}: AdvancedChartProps) {
  const renderScatterChart = () => {
    const scatterData = data as ScatterDataPoint[];
    const maxX = Math.max(...scatterData.map((d) => d.x), 0);
    const maxY = Math.max(...scatterData.map((d) => d.y), 0);

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => (
          <g key={val}>
            <line x1={val} y1={0} x2={val} y2={100} stroke="currentColor" strokeWidth="0.5" opacity="0.2" className="text-muted-foreground" />
            <line x1={0} y1={val} x2={100} y2={val} stroke="currentColor" strokeWidth="0.5" opacity="0.2" className="text-muted-foreground" />
          </g>
        ))}
        {/* Data points */}
        {scatterData.map((point, index) => {
          const x = (point.x / maxX) * 100;
          const y = 100 - (point.y / maxY) * 100;
          return (
            <circle key={index} cx={x} cy={y} r="3" fill={point.color || chartColors.default()} className="hover:opacity-80 transition-opacity">
              {point.label && <title>{point.label}</title>}
            </circle>
          );
        })}
      </svg>
    );
  };

  const renderRadarChart = () => {
    const radarData = data as RadarDataPoint[];
    const maxValue = Math.max(...radarData.map((d) => d.maxValue || d.value), 0);
    const centerX = 50;
    const centerY = 50;
    const radius = 40;
    const angleStep = (2 * Math.PI) / radarData.length;

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
            className="text-muted-foreground"
          />
        ))}
        {/* Axis lines */}
        {radarData.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <line key={index} x1={centerX} y1={centerY} x2={x} y2={y} stroke="currentColor" strokeWidth="0.5" opacity="0.2" className="text-muted-foreground" />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={radarData
            .map((point, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const scale = (point.value / maxValue) * radius;
              const x = centerX + scale * Math.cos(angle);
              const y = centerY + scale * Math.sin(angle);
              return `${x},${y}`;
            })
            .join('')}
          fill={chartColors.default()}
          opacity="0.3"
        />
        <polyline
          points={radarData
            .map((point, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const scale = (point.value / maxValue) * radius;
              const x = centerX + scale * Math.cos(angle);
              const y = centerY + scale * Math.sin(angle);
              return `${x},${y}`;
            })
            .join('')}
          fill="none"
          stroke={chartColors.default()}
          strokeWidth="2"
        />
        {/* Labels */}
        {radarData.map((point, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = centerX + (radius + 5) * Math.cos(angle);
          const y = centerY + (radius + 5) * Math.sin(angle);
          return (
            <text key={index} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-700 dark:fill-gray-300">
              {point.label}
            </text>
          );
        })}
      </svg>
    );
  };

  const renderDonutChart = () => {
    const donutData = data as { label: string; value: number; color?: string }[];
    let currentAngle = -90;
    const total = donutData.reduce((sum, d) => sum + d.value, 0);
    const outerRadius = 40;
    const innerRadiusValue = outerRadius * innerRadius;

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {donutData.map((point, index) => {
          const percentage = (point.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const largeArcFlag = angle > 180 ? 1 : 0;
          const x1 = 50 + outerRadius * Math.cos((currentAngle * Math.PI) / 180);
          const y1 = 50 + outerRadius * Math.sin((currentAngle * Math.PI) / 180);
          const x2 = 50 + outerRadius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const y2 = 50 + outerRadius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
          const innerX1 = 50 + innerRadiusValue * Math.cos((currentAngle * Math.PI) / 180);
          const innerY1 = 50 + innerRadiusValue * Math.sin((currentAngle * Math.PI) / 180);
          const innerX2 = 50 + innerRadiusValue * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const innerY2 = 50 + innerRadiusValue * Math.sin(((currentAngle + angle) * Math.PI) / 180);
          const pathData = [`M ${x1} ${y1}`, `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, `L ${innerX2} ${innerY2}`, `A ${innerRadiusValue} ${innerRadiusValue} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`, 'Z'].join('');
          currentAngle += angle;
          return (
            <path key={index} d={pathData} fill={point.color || `hsl(${(index * 360) / donutData.length}, 70%, 50%)`} className="hover:opacity-80 transition-opacity">
              <title>{`${point.label}: ${point.value}`}</title>
            </path>
          );
        })}
        {/* Center text */}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-gray-900 dark:fill-gray-100">
          {total}
        </text>
      </svg>
    );
  };

  const renderGaugeChart = () => {
    const percentage = ((value - min) / (max - min)) * 100;
    const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees
    const radius = 40;
    const centerX = 50;
    const centerY = 70;
    // Determine color based on value
    let color = chartColors.success();
    if (percentage > 75) {
      color = chartColors.danger();
    } else if (percentage > 50) {
      color = chartColors.warning();
    }

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background arc */}
        <path d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`} fill="none" stroke="currentColor" strokeWidth="8" opacity="0.2" className="text-muted-foreground" />
        {/* Value arc */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 ${angle > 0 ? 1 : 0} 1 ${centerX + radius * Math.cos((angle * Math.PI) / 180)} ${centerY + radius * Math.sin((angle * Math.PI) / 180)}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value text */}
        <text x={centerX} y={centerY + 10} textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-900 dark:fill-gray-100">
          {value}
        </text>
        {/* Min/Max labels */}
        <text x={centerX - radius - 5} y={centerY + 5} textAnchor="end" className="text-xs fill-gray-600 dark:fill-gray-400">
          {min}
        </text>
        <text x={centerX + radius + 5} y={centerY + 5} textAnchor="start" className="text-xs fill-gray-600 dark:fill-gray-400">
          {max}
        </text>
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'scatter':
        return renderScatterChart();
      case 'radar':
        return renderRadarChart();
      case 'donut':
        return renderDonutChart();
      case 'gauge':
        return renderGaugeChart();
      default:
        return null;
    }
  };

  return (
    <div className={clsx('bg-background rounded-lg border border-border p-6', className)}>
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }} className="relative">
        {renderChart()}
      </div>
      {(type === 'donut' || type === 'scatter') && (
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {(data as { label?: string; value?: number; color?: string }[]).map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: point.color || (type === 'scatter' ? chartColors.default() : `hsl(${(index * 360) / data.length}, 70%, 50%)`),
                }}
              />
              <span className="text-sm text-muted-foreground">
                {point.label || `Point ${index + 1}`}
                {point.value !== undefined && `: ${point.value}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
