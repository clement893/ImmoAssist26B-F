'use client';

import { Plus, Search, Filter, MoreVertical, MessageSquare, Paperclip } from 'lucide-react';

export default function DemoTransactions() {
  const columns = [
    {
      title: 'Not Ready',
      count: 3,
      cards: [
        {
          title: 'Property valuation needed',
          description: 'Waiting for professional assessment',
          labels: [
            { text: 'Urgent', color: 'bg-red-100 text-red-600' },
            { text: 'Valuation', color: 'bg-blue-100 text-blue-600' },
          ],
          avatars: ['JD', 'SK'],
          comments: 3,
          attachments: 5,
        },
        {
          title: 'Document verification',
          description: 'Missing title deed',
          labels: [
            { text: 'Documents', color: 'bg-amber-100 text-amber-600' },
          ],
          avatars: ['AM'],
          comments: 1,
          attachments: 2,
        },
      ],
    },
    {
      title: 'To Do',
      count: 5,
      cards: [
        {
          title: 'Schedule property viewing',
          description: 'Client requested 3 time slots',
          labels: [
            { text: 'Viewing', color: 'bg-green-100 text-green-600' },
            { text: 'High Priority', color: 'bg-orange-100 text-orange-600' },
          ],
          avatars: ['LC', 'MR'],
          comments: 7,
          attachments: 3,
        },
        {
          title: 'Prepare contract draft',
          description: 'Standard residential agreement',
          labels: [
            { text: 'Legal', color: 'bg-purple-100 text-purple-600' },
          ],
          avatars: ['TW', 'BH'],
          comments: 2,
          attachments: 1,
        },
        {
          title: 'Market analysis report',
          description: 'Comparative market analysis for downtown area',
          labels: [
            { text: 'Analysis', color: 'bg-indigo-100 text-indigo-600' },
          ],
          avatars: ['RP'],
          comments: 0,
          attachments: 8,
        },
      ],
    },
    {
      title: 'In Progress',
      count: 4,
      cards: [
        {
          title: 'Negotiating offer',
          description: 'Counter-offer submitted',
          labels: [
            { text: 'Negotiation', color: 'bg-blue-100 text-blue-600' },
            { text: 'Active', color: 'bg-green-100 text-green-600' },
          ],
          avatars: ['DS', 'KL', 'NP'],
          comments: 12,
          attachments: 4,
        },
        {
          title: 'Home inspection scheduled',
          description: 'Inspector confirmed for Friday',
          labels: [
            { text: 'Inspection', color: 'bg-teal-100 text-teal-600' },
          ],
          avatars: ['GF', 'HJ'],
          comments: 5,
          attachments: 2,
        },
      ],
    },
    {
      title: 'Completed',
      count: 8,
      cards: [
        {
          title: 'Contract signed',
          description: 'All parties have signed',
          labels: [
            { text: 'Closed', color: 'bg-green-100 text-green-600' },
          ],
          avatars: ['XY'],
          comments: 15,
          attachments: 10,
        },
        {
          title: 'Keys handed over',
          description: 'Transaction complete',
          labels: [
            { text: 'Done', color: 'bg-gray-100 text-gray-600' },
          ],
          avatars: ['QW', 'ER'],
          comments: 8,
          attachments: 6,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">Transactions Board</h1>
            <p className="text-sm font-light text-gray-500">
              Manage your real estate transactions
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            <span className="text-sm font-light">Add Task</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full pl-12 pr-4 py-3 bg-white border-0 rounded-xl shadow-sm text-sm font-light text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-light text-gray-700">Filter</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-normal text-gray-900">{column.title}</h2>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-light rounded-full">
                  {column.count}
                </span>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {column.cards.map((card, cardIndex) => (
                <div
                  key={cardIndex}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  {/* Card Title */}
                  <h3 className="text-sm font-normal text-gray-900 mb-2">
                    {card.title}
                  </h3>

                  {/* Card Description */}
                  <p className="text-xs font-light text-gray-500 mb-4">
                    {card.description}
                  </p>

                  {/* Labels */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {card.labels.map((label, labelIndex) => (
                      <span
                        key={labelIndex}
                        className={`px-3 py-1 rounded-full text-xs font-light ${label.color}`}
                      >
                        {label.text}
                      </span>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between">
                    {/* Avatars */}
                    <div className="flex -space-x-2">
                      {card.avatars.map((avatar, avatarIndex) => (
                        <div
                          key={avatarIndex}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-light border-2 border-white"
                        >
                          {avatar}
                        </div>
                      ))}
                    </div>

                    {/* Comments and Attachments */}
                    <div className="flex items-center gap-3">
                      {card.comments > 0 && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs font-light">{card.comments}</span>
                        </div>
                      )}
                      {card.attachments > 0 && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-xs font-light">{card.attachments}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Card Button */}
              <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-light text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors">
                + Add card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
