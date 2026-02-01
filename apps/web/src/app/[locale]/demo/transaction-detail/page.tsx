'use client';

import { useState } from 'react';
import {
  Home,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Download,
  Upload,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Bed,
  Bath,
  Square,
  Building2,
  Paperclip,
  Plus,
  Edit,
  Send,
  Image as ImageIcon,
} from 'lucide-react';

export default function TransactionDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');

  // Mock transaction data
  const transaction = {
    id: '1',
    address: '123 Rue de la Paix, Montreal, QC H3B 1A1',
    price: 485000,
    status: 'in_progress',
    type: 'sale',
    propertyType: 'Condo',
    bedrooms: 2,
    bathrooms: 2,
    area: 1200,
    client: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (514) 555-0123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
    agent: {
      name: 'John Doe',
      email: 'john.doe@agency.com',
      phone: '+1 (514) 555-0456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    },
    createdAt: '2024-01-15',
    expectedClosing: '2024-03-15',
  };

  // Transaction steps with progress
  const steps = [
    {
      id: 1,
      title: 'Initial contact',
      status: 'completed',
      date: '2024-01-15',
      description: 'First meeting with client',
    },
    {
      id: 2,
      title: 'Property viewing',
      status: 'completed',
      date: '2024-01-20',
      description: 'Property visit completed',
    },
    {
      id: 3,
      title: 'Offer submitted',
      status: 'completed',
      date: '2024-01-25',
      description: 'Offer accepted by seller',
    },
    {
      id: 4,
      title: 'Inspection',
      status: 'in_progress',
      date: '2024-02-01',
      description: 'Home inspection scheduled',
    },
    {
      id: 5,
      title: 'Financing',
      status: 'pending',
      date: '2024-02-10',
      description: 'Mortgage approval pending',
    },
    {
      id: 6,
      title: 'Final walkthrough',
      status: 'pending',
      date: '2024-03-01',
      description: 'Final property inspection',
    },
    {
      id: 7,
      title: 'Closing',
      status: 'pending',
      date: '2024-03-15',
      description: 'Sign final documents',
    },
  ];

  // Documents
  const documents = [
    { id: 1, name: 'Purchase Agreement', type: 'PDF', size: '2.4 MB', uploadedAt: '2024-01-25', status: 'signed' },
    { id: 2, name: 'Property Disclosure', type: 'PDF', size: '1.8 MB', uploadedAt: '2024-01-20', status: 'signed' },
    { id: 3, name: 'Inspection Report', type: 'PDF', size: '5.2 MB', uploadedAt: '2024-02-01', status: 'pending' },
    { id: 4, name: 'Mortgage Pre-Approval', type: 'PDF', size: '890 KB', uploadedAt: '2024-01-18', status: 'approved' },
  ];

  // Activity timeline
  const activities = [
    {
      id: 1,
      type: 'comment',
      user: 'John Doe',
      action: 'added a comment',
      content: 'Inspection scheduled for Feb 1st at 10:00 AM',
      timestamp: '2h ago',
    },
    {
      id: 2,
      type: 'document',
      user: 'Sarah Johnson',
      action: 'uploaded a document',
      content: 'Inspection Report.pdf',
      timestamp: '5h ago',
    },
    {
      id: 3,
      type: 'status',
      user: 'System',
      action: 'updated status',
      content: 'Moved to Inspection phase',
      timestamp: '1d ago',
    },
    {
      id: 4,
      type: 'meeting',
      user: 'John Doe',
      action: 'scheduled a meeting',
      content: 'Property viewing on Jan 20th',
      timestamp: '2d ago',
    },
  ];

  // Photos
  const photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', title: 'Living Room' },
    { id: 2, url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', title: 'Kitchen' },
    { id: 3, url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400', title: 'Bedroom' },
    { id: 4, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', title: 'Bathroom' },
  ];


  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: MessageSquare },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Transaction Details</h1>
            </div>
            <p className="text-sm text-gray-500 ml-8">Transaction #{transaction.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Edit className="w-4 h-4 inline mr-2" />
              Edit
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-sm font-medium text-white hover:shadow-lg transition-shadow">
              <Send className="w-4 h-4 inline mr-2" />
              Send Update
            </button>
          </div>
        </div>

        {/* Progress Steps - Vue Récap */}
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Transaction progress</h2>
              <p className="text-sm text-gray-500">Track all steps from initial contact to closing</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Expected closing</p>
              <p className="text-lg font-semibold text-gray-900">{transaction.expectedClosing}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative mb-12">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
              style={{ width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` }}
            ></div>

            <div className="relative flex justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.status === 'completed'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                        : step.status === 'in_progress'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100'
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : step.status === 'in_progress' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <p
                      className={`text-xs font-medium mb-1 ${
                        step.status === 'completed' || step.status === 'in_progress'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.date}</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[100px]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Details */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Current step: Inspection</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Home inspection scheduled for February 1st at 10:00 AM. Inspector will check all major systems and
                  provide a detailed report.
                </p>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Property Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="text-sm font-medium text-gray-900">{transaction.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Property type</p>
                            <p className="text-sm font-medium text-gray-900">{transaction.propertyType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="text-sm font-medium text-gray-900">
                              ${transaction.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <Bed className="w-5 h-5 text-gray-600 mb-2" />
                        <p className="text-2xl font-semibold text-gray-900">{transaction.bedrooms}</p>
                        <p className="text-xs text-gray-500">Bedrooms</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <Bath className="w-5 h-5 text-gray-600 mb-2" />
                        <p className="text-2xl font-semibold text-gray-900">{transaction.bathrooms}</p>
                        <p className="text-xs text-gray-500">Bathrooms</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <Square className="w-5 h-5 text-gray-600 mb-2" />
                        <p className="text-2xl font-semibold text-gray-900">{transaction.area}</p>
                        <p className="text-xs text-gray-500">sq ft</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Client</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={transaction.client.avatar}
                          alt={transaction.client.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.client.name}</p>
                          <p className="text-xs text-gray-500">Buyer</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {transaction.client.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {transaction.client.phone}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          Message
                        </button>
                        <button className="flex-1 px-3 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                          <Phone className="w-4 h-4 inline mr-1" />
                          Call
                        </button>
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Agent</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={transaction.agent.avatar}
                          alt={transaction.agent.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.agent.name}</p>
                          <p className="text-xs text-gray-500">Real Estate Agent</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {transaction.agent.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {transaction.agent.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Transaction documents</h3>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm font-medium hover:bg-blue-600 transition-colors">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Document
                  </button>
                </div>

                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type} • {doc.size} • Uploaded {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'signed'
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'approved'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {doc.status}
                      </span>
                      <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Activity timeline</h3>
                </div>

                {/* Add Comment */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <Paperclip className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                      <Send className="w-4 h-4 inline mr-2" />
                      Post Comment
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.type === 'comment' && <MessageSquare className="w-5 h-5 text-gray-600" />}
                        {activity.type === 'document' && <FileText className="w-5 h-5 text-gray-600" />}
                        {activity.type === 'status' && <CheckCircle2 className="w-5 h-5 text-gray-600" />}
                        {activity.type === 'meeting' && <Calendar className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.user} <span className="font-normal text-gray-600">{activity.action}</span>
                          </p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                        <p className="text-sm text-gray-700">{activity.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Property photos</h3>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm font-medium hover:bg-blue-600 transition-colors">
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Photos
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-video rounded-2xl overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white font-medium">{photo.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
