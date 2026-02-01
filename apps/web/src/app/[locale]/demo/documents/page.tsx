'use client';

import { useState } from 'react';
import {
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function DemoDocuments() {
  const [currentDate] = useState(new Date(2024, 11, 7)); // December 7, 2024
  const [selectedTab, setSelectedTab] = useState('all');
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const tabs = [
    { id: 'all', label: 'All Documents' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'inspections', label: 'Inspections' },
    { id: 'financial', label: 'Financial' },
  ];

  const documents = [
    {
      title: 'Property Purchase Agreement',
      subtitle: '123 Maple Street',
      status: 'Completed',
      statusIcon: CheckCircle2,
      statusColor: 'text-green-600',
      date: 'Dec 7, 2024',
      category: 'Contract',
    },
    {
      title: 'Home Inspection Report',
      subtitle: '456 Oak Avenue',
      status: 'Pending Review',
      statusIcon: Clock,
      statusColor: 'text-amber-600',
      date: 'Dec 6, 2024',
      category: 'Inspection',
    },
    {
      title: 'Title Insurance Policy',
      subtitle: '789 Pine Road',
      status: 'Completed',
      statusIcon: CheckCircle2,
      statusColor: 'text-green-600',
      date: 'Dec 5, 2024',
      category: 'Legal',
    },
    {
      title: 'Mortgage Pre-Approval',
      subtitle: '321 Birch Lane',
      status: 'In Progress',
      statusIcon: Clock,
      statusColor: 'text-blue-600',
      date: 'Dec 4, 2024',
      category: 'Financial',
    },
    {
      title: 'Property Disclosure Statement',
      subtitle: '654 Cedar Court',
      status: 'Completed',
      statusIcon: CheckCircle2,
      statusColor: 'text-green-600',
      date: 'Dec 3, 2024',
      category: 'Legal',
    },
  ];

  // Calendar data
  const daysInMonth = 31;
  const firstDayOfMonth = 1; // Sunday
  const today = 7;

  return (
    <div className="min-h-screen">
      {/* Hero Section - Soft gradient like Upthrom */}
      <div className="bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 px-10 py-16">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-light text-white mb-4">
            Document Management
          </h1>
          <p className="text-lg font-light text-white/90 mb-8">
            Manage all your real estate documents in one place
          </p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents, contracts, reports..."
              className="w-full pl-16 pr-6 py-5 bg-white rounded-2xl shadow-lg text-base font-light text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Documents List */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                    px-6 py-3 rounded-xl text-sm font-light transition-all duration-200
                    ${
                      selectedTab === tab.id
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Documents List */}
            <div className="space-y-4">
              {documents.map((doc, index) => {
                const StatusIcon = doc.statusIcon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-emerald-500" />
                          <h3 className="text-base font-normal text-gray-900">{doc.title}</h3>
                        </div>
                        <p className="text-sm font-light text-gray-500 mb-3">{doc.subtitle}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${doc.statusColor}`} />
                            <span className={`text-xs font-light ${doc.statusColor}`}>
                              {doc.status}
                            </span>
                          </div>
                          <span className="text-xs font-light text-gray-400">{doc.date}</span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-light rounded-full">
                            {doc.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Download className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Filters & Calendar */}
          <div className="space-y-8">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-normal text-gray-900 mb-6">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-light text-gray-600 mb-2 block">Status</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm font-light text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>All Statuses</option>
                    <option>Completed</option>
                    <option>In Progress</option>
                    <option>Pending Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-light text-gray-600 mb-2 block">Category</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm font-light text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>All Categories</option>
                    <option>Contract</option>
                    <option>Inspection</option>
                    <option>Legal</option>
                    <option>Financial</option>
                  </select>
                </div>
                <button className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-light">
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-normal text-gray-900">{currentMonth}</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className="text-center text-xs font-light text-gray-500 pb-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const isToday = day === today;
                  return (
                    <button
                      key={day}
                      className={`
                        aspect-square flex items-center justify-center text-sm font-light rounded-full
                        transition-all duration-200
                        ${
                          isToday
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
