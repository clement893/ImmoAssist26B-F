/**
 * ReportViewer Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import ReportViewer from './ReportViewer';
import type { ReportData } from './ReportViewer';

const meta: Meta<typeof ReportViewer> = {
  title: 'Analytics/ReportViewer',
  component: ReportViewer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ReportViewer>;

const sampleReport: ReportData = {
  id: '1',
  name: 'Monthly Revenue Report',
  description: 'Revenue trends for the past 6 months',
  dateRange: {
    start: '2024-01-01',
    end: '2024-06-30',
  },
  format: 'both',
  data: {
    table: [
      { date: '2024-01-01', revenue: 12500, users: 1200 },
      { date: '2024-02-01', revenue: 15200, users: 1250 },
      { date: '2024-03-01', revenue: 18900, users: 1300 },
    ],
    chart: [
      { label: 'Jan', value: 12500 },
      { label: 'Feb', value: 15200 },
      { label: 'Mar', value: 18900 },
    ],
    chartType: 'line',
  },
  generatedAt: new Date().toISOString(),
};

export const Default: Story = {
  args: {
    report: sampleReport,
    onRefresh: async () => {
      console.log('Refresh report');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onExport: async (format) => {
      console.log('Export report:', format);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onShare: () => console.log('Share report'),
  },
};

export const TableOnly: Story = {
  args: {
    report: {
      ...sampleReport,
      format: 'table',
    },
    onRefresh: async () => {
      console.log('Refresh report');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onExport: async (format) => {
      console.log('Export report:', format);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const ChartOnly: Story = {
  args: {
    report: {
      ...sampleReport,
      format: 'chart',
      data: {
        chart: [
          { label: 'Jan', value: 12500 },
          { label: 'Feb', value: 15200 },
          { label: 'Mar', value: 18900 },
        ],
        chartType: 'bar',
      },
    },
    onRefresh: async () => {
      console.log('Refresh report');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onExport: async (format) => {
      console.log('Export report:', format);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
