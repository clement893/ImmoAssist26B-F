/** * Event History Component * Historical event log with detailed information */ 'use client';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { History, Filter, Search } from 'lucide-react';
export interface EventHistoryEntry extends Record<string, unknown> {
  id: string;
  timestamp: string;
  eventType: string;
  eventName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
}
export interface EventHistoryProps {
  events: EventHistoryEntry[];
  onFilterChange?: (filters: EventFilters) => void;
  className?: string;
}
export interface EventFilters {
  eventType?: string;
  severity?: EventHistoryEntry['severity'];
  source?: string;
  dateRange?: { start: string; end: string };
  search?: string;
}
const severityColors = {
  low: 'default' as const,
  medium: 'info' as const,
  high: 'warning' as const,
  critical: 'error' as const,
};
export default function EventHistory({ events, onFilterChange, className }: EventHistoryProps) {
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (filters.eventType) {
      filtered = filtered.filter((e) => e.eventType === filters.eventType);
    }
    if (filters.severity) {
      filtered = filtered.filter((e) => e.severity === filters.severity);
    }
    if (filters.source) {
      filtered = filtered.filter((e) => e.source === filters.source);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.eventName.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.eventType.toLowerCase().includes(term) ||
          e.source.toLowerCase().includes(term)
      );
    }
    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter((e) => {
        const date = new Date(e.timestamp);
        return date >= start && date <= end;
      });
    }
    return filtered;
  }, [events, filters, searchTerm]);
  const uniqueEventTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.eventType));
    return Array.from(types);
  }, [events]);
  const uniqueSources = useMemo(() => {
    const sources = new Set(events.map((e) => e.source));
    return Array.from(sources);
  }, [events]);
  const columns: Column<EventHistoryEntry>[] = [
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: (value) => (
        <div className="text-foreground">
          {' '}
          <div className="font-medium text-sm">
            {' '}
            {new Date(value as string).toLocaleDateString()}{' '}
          </div>{' '}
          <div className="text-xs text-muted-foreground">
            {' '}
            {new Date(value as string).toLocaleTimeString()}{' '}
          </div>{' '}
        </div>
      ),
    },
    {
      key: 'eventName',
      label: 'Event',
      sortable: true,
      render: (value, event) => (
        <div>
          {' '}
          <div className="text-sm font-medium text-foreground"> {value as string} </div>{' '}
          <div className="text-xs text-muted-foreground"> {event.eventType} </div>{' '}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => <span className="text-sm text-foreground"> {value as string} </span>,
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value) => {
        const severity = value as EventHistoryEntry['severity'];
        return <Badge variant={severityColors[severity]}>{severity}</Badge>;
      },
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) => (
        <span className="text-sm text-foreground font-mono"> {value as string} </span>
      ),
    },
    {
      key: 'userName',
      label: 'User',
      render: (value) => (
        <span className="text-sm text-foreground"> {(value as string) || '-'} </span>
      ),
    },
  ];
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="mb-6">
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {' '}
            <History className="w-5 h-5" /> Event History{' '}
          </h3>{' '}
          <div className="text-sm text-muted-foreground">
            {' '}
            {filteredEvents.length} of {events.length} events{' '}
          </div>{' '}
        </div>{' '}
        {/* Filters */}{' '}
        <div className="flex items-center gap-4 flex-wrap">
          {' '}
          <div className="flex-1 min-w-[200px]">
            {' '}
            <div className="relative">
              {' '}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />{' '}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className={clsx(
                  'w-full pl-10 pr-4 py-2 border rounded-lg text-sm',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                )}
              />{' '}
            </div>{' '}
          </div>{' '}
          <div className="flex items-center gap-2">
            {' '}
            <Filter className="w-4 h-4 text-muted-foreground" />{' '}
            <select
              value={filters.eventType || ''}
              onChange={(e) => {
                const newFilters = { ...filters, eventType: e.target.value || undefined };
                setFilters(newFilters);
                onFilterChange?.(newFilters);
              }}
              className={clsx(
                'px-3 py-2 border rounded-lg text-sm',
                'bg-background',
                'text-foreground',
                'border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            >
              {' '}
              <option value="">All Types</option>{' '}
              {uniqueEventTypes.map((type) => (
                <option key={type} value={type}>
                  {' '}
                  {type}{' '}
                </option>
              ))}{' '}
            </select>{' '}
            <select
              value={filters.severity || ''}
              onChange={(e) => {
                const newFilters = {
                  ...filters,
                  severity: e.target.value as EventHistoryEntry['severity'] | undefined,
                };
                setFilters(newFilters);
                onFilterChange?.(newFilters);
              }}
              className={clsx(
                'px-3 py-2 border rounded-lg text-sm',
                'bg-background',
                'text-foreground',
                'border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            >
              {' '}
              <option value="">All Severities</option> <option value="low">Low</option>{' '}
              <option value="medium">Medium</option> <option value="high">High</option>{' '}
              <option value="critical">Critical</option>{' '}
            </select>{' '}
            <select
              value={filters.source || ''}
              onChange={(e) => {
                const newFilters = { ...filters, source: e.target.value || undefined };
                setFilters(newFilters);
                onFilterChange?.(newFilters);
              }}
              className={clsx(
                'px-3 py-2 border rounded-lg text-sm',
                'bg-background',
                'text-foreground',
                'border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            >
              {' '}
              <option value="">All Sources</option>{' '}
              {uniqueSources.map((source) => (
                <option key={source} value={source}>
                  {' '}
                  {source}{' '}
                </option>
              ))}{' '}
            </select>{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
      <DataTable
        data={filteredEvents as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        pageSize={20}
        emptyMessage="No events found"
      />{' '}
    </Card>
  );
}
