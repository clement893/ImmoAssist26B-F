'use client';

import { useState } from 'react';
import {
  Search,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye,
  MoreVertical,
} from 'lucide-react';

export default function DemoDocuments() {
  const [currentDate] = useState(new Date(2024, 11, 7)); // December 7, 2024
  const [selectedTab, setSelectedTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Documents' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'inspections', label: 'Inspections' },
    { id: 'financial', label: 'Financial' },
    { id: 'legal', label: 'Legal' },
  ];

  const documents = [
    {
      title: 'Verification of documents and photos in the government database',
      status: 'New',
      statusColor: 'bg-blue-100 text-blue-700',
      date: 'December 7, 2024',
      type: 'Verification',
      icon: FileText,
    },
    {
      title: 'Verification of documents by submitting to the government',
      status: 'Verification awaited',
      statusColor: 'bg-amber-100 text-amber-700',
      date: 'December 6, 2024',
      type: 'Verification',
      icon: FileText,
    },
    {
      title: 'Construction site inspection',
      status: 'New',
      statusColor: 'bg-blue-100 text-blue-700',
      date: 'December 5, 2024',
      type: 'Inspection',
      icon: FileText,
    },
    {
      title: 'Connection was completed successfully',
      status: 'Completed',
      statusColor: 'bg-green-100 text-green-700',
      date: 'December 4, 2024',
      type: 'Connection',
      icon: FileText,
    },
    {
      title: 'Property appraisal report',
      status: 'New',
      statusColor: 'bg-blue-100 text-blue-700',
      date: 'December 3, 2024',
      type: 'Financial',
      icon: FileText,
    },
    {
      title: 'Title search documentation',
      status: 'Verification awaited',
      statusColor: 'bg-amber-100 text-amber-700',
      date: 'December 2, 2024',
      type: 'Legal',
      icon: FileText,
    },
  ];

  // Calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth();
  const today = currentDate.getDate();

  return (
    <div className="space-y-8">
      {/* Hero Section with Background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-12 shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
            <span className="text-sm font-semibold text-white">Real Estate Documentation Hub</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold text-white">
            Welcome to your
            <br />
            Document Center
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-emerald-50">
            Manage all your property documents, contracts, and verifications in one secure place
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents, contracts, or properties..."
              className="w-full rounded-xl border-0 bg-white py-4 pl-12 pr-4 text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Left Column - Documents List */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {documents.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <div
                  key={index}
                  className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-slate-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${doc.statusColor}`}>
                          {doc.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {doc.date}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{doc.type}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                        <Download className="h-5 w-5" />
                      </button>
                      <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Filters & Calendar */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Filters</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option>All statuses</option>
                  <option>New</option>
                  <option>Verification awaited</option>
                  <option>Completed</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Document Type</label>
                <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option>All types</option>
                  <option>Verification</option>
                  <option>Inspection</option>
                  <option>Financial</option>
                  <option>Legal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-xs font-semibold text-slate-600">
                  {day}
                </div>
              ))}
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`flex h-9 items-center justify-center rounded-lg text-xs transition-colors ${
                    day === null
                      ? ''
                      : day === today
                        ? 'bg-indigo-600 font-bold text-white'
                        : day === 15
                          ? 'bg-amber-100 font-semibold text-amber-700'
                          : 'cursor-pointer font-medium text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-indigo-600" />
                <span className="text-slate-600">Today</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-amber-100" />
                <span className="text-slate-600">Deadline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
