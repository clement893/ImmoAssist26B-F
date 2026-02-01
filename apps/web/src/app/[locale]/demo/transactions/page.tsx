'use client';

import { Plus, Search, Filter, MoreVertical, MessageSquare, Paperclip } from 'lucide-react';

export default function DemoTransactions() {
  const columns = [
    {
      id: 'not-ready',
      title: 'Not Ready',
      color: 'bg-slate-200',
      borderColor: 'border-slate-300',
      count: 4,
    },
    {
      id: 'to-do',
      title: 'To Do',
      color: 'bg-blue-200',
      borderColor: 'border-blue-300',
      count: 5,
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-amber-200',
      borderColor: 'border-amber-300',
      count: 3,
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-green-200',
      borderColor: 'border-green-300',
      count: 6,
    },
  ];

  const cards = {
    'not-ready': [
      {
        title: '123 Maple Street',
        description: 'Initial documentation needed',
        image: '/demo/house-1.jpg',
        labels: ['Label', 'Label', 'Label'],
        comments: 3,
        attachments: 1,
        avatars: ['JD', 'SM'],
      },
      {
        title: '456 Oak Avenue',
        description: 'Waiting for seller approval',
        image: '/demo/house-2.jpg',
        labels: ['Label', 'Label'],
        comments: 0,
        attachments: 3,
        avatars: ['AB'],
      },
      {
        title: '789 Pine Road',
        description: 'Property inspection pending',
        image: '/demo/house-3.jpg',
        labels: ['Label'],
        comments: 5,
        attachments: 1,
        avatars: ['CD', 'EF', 'GH'],
      },
    ],
    'to-do': [
      {
        title: '321 Birch Lane',
        description: 'Schedule property viewing',
        image: '/demo/house-4.jpg',
        labels: ['Label', 'Label'],
        comments: 2,
        attachments: 0,
        avatars: ['IJ', 'KL'],
      },
      {
        title: '654 Cedar Court',
        description: 'Prepare offer documents',
        image: '/demo/house-5.jpg',
        labels: ['Label', 'Label', 'Label'],
        comments: 5,
        attachments: 2,
        avatars: ['MN'],
      },
    ],
    'in-progress': [
      {
        title: '987 Elm Street',
        description: 'Negotiating final price',
        image: '/demo/house-6.jpg',
        labels: ['Label', 'Label'],
        comments: 8,
        attachments: 5,
        avatars: ['OP', 'QR'],
      },
      {
        title: '147 Willow Way',
        description: 'Home inspection in progress',
        image: '/demo/house-7.jpg',
        labels: ['Label'],
        comments: 3,
        attachments: 1,
        avatars: ['ST', 'UV', 'WX'],
      },
    ],
    completed: [
      {
        title: '258 Spruce Drive',
        description: 'Contract signed and finalized',
        image: '/demo/house-8.jpg',
        labels: ['Label', 'Label'],
        comments: 12,
        attachments: 8,
        avatars: ['YZ', 'AB'],
      },
      {
        title: '369 Ash Boulevard',
        description: 'Keys handed over to buyer',
        image: '/demo/house-9.jpg',
        labels: ['Label'],
        comments: 6,
        attachments: 3,
        avatars: ['CD'],
      },
    ],
  };

  const labelColors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
  ];

  const avatarColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-teal-500',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Board</h1>
          <p className="mt-2 text-lg text-slate-600">Manage your real estate transactions</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl">
          <Plus className="h-5 w-5" />
          Add Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-80 rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            Sort
          </button>
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            View
          </button>
          <button className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {columns.map((column, columnIndex) => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{column.title}</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                  {column.count}
                </span>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {cards[column.id as keyof typeof cards]?.map((card, cardIndex) => (
                <div
                  key={cardIndex}
                  className="group cursor-pointer rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-slate-300"
                >
                  {/* Card Image */}
                  {card.image && (
                    <div className="mb-3 overflow-hidden rounded-lg">
                      <div className="h-32 w-full bg-gradient-to-br from-slate-200 to-slate-300" />
                    </div>
                  )}

                  {/* Card Title */}
                  <h4 className="mb-2 font-semibold text-slate-900">{card.title}</h4>

                  {/* Card Description */}
                  <p className="mb-3 text-sm text-slate-600">{card.description}</p>

                  {/* Labels */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {card.labels.map((label, labelIndex) => (
                      <span
                        key={labelIndex}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${labelColors[labelIndex % labelColors.length]}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {card.comments > 0 && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-medium">{card.comments}</span>
                        </div>
                      )}
                      {card.attachments > 0 && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs font-medium">{card.attachments}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex -space-x-2">
                      {card.avatars.map((avatar, avatarIndex) => (
                        <div
                          key={avatarIndex}
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${avatarColors[avatarIndex % avatarColors.length]} text-xs font-bold text-white ring-2 ring-white`}
                        >
                          {avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Card Button */}
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100">
                <Plus className="h-4 w-4" />
                Add new task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
