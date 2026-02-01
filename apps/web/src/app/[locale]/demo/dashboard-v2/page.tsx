'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Target,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  Bell,
  Search,
  Mic,
  Send,
  Calendar,
  Plus,
  MoreVertical,
  TrendingDown,
} from 'lucide-react';

export default function DashboardV2() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Mock data
  const stats = {
    transactions: 24,
    activeDeals: 8,
    totalRevenue: 485000,
    clients: 156,
    properties: 42,
    streak: 12,
    level: 7,
    xp: 2450,
    nextLevelXp: 3000,
  };

  const recentActivity = [
    { id: 1, action: 'New deal closed', client: 'Sarah Johnson', amount: '$450,000', time: '2h ago', type: 'success' },
    { id: 2, action: 'Meeting scheduled', client: 'Michael Chen', time: '4h ago', type: 'info' },
    { id: 3, action: 'Document signed', client: 'Emma Wilson', time: '1d ago', type: 'success' },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Property viewing', client: 'Alex Morgan', time: 'Today, 2:00 PM' },
    { id: 2, title: 'Contract review', client: 'Lisa Chen', time: 'Today, 4:30 PM' },
    { id: 3, title: 'Follow-up call', client: 'John Smith', time: 'Tomorrow, 10:00 AM' },
  ];

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      console.log('Sending message:', chatMessage);
      setChatMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center">
              <span className="text-white font-bold text-lg">IA</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Real Estate</h1>
              <p className="text-sm text-gray-500">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
              <Plus className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                alt="User"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">Real Estate Agent</p>
              </div>
            </div>
            <button className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
              <Search className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-3 space-y-6">
            {/* Date Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-5xl font-light text-gray-900 mb-1">19</div>
                  <div className="text-sm text-gray-500">Tue, December</div>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 text-sm font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2">
                Show my Tasks
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button className="w-full mt-3 p-2.5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <Calendar className="w-5 h-5 text-gray-600 mx-auto" />
              </button>
            </div>

            {/* Account Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-900">Main Account</span>
                <button className="text-xs text-gray-500">Direct Debits ▾</button>
              </div>
              <p className="text-xs text-gray-500 mb-2">Linked to main account</p>
              <p className="text-lg font-semibold text-gray-900 mb-6">**** 2719</p>
              <div className="flex gap-2 mb-6">
                <button className="flex-1 bg-black text-white rounded-full py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">
                  Receive
                </button>
                <button className="flex-1 bg-gray-100 text-gray-900 rounded-full py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors">
                  Send
                </button>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Monthly fee</span>
                  <span className="text-sm font-semibold text-gray-900">$ 25.00</span>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <button className="w-full bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Middle Column */}
          <div className="col-span-6 space-y-6">
            {/* AI Assistant Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-3xl font-light text-gray-900 mb-2">
                  Hey, Need help? 👋
                </h2>
                <p className="text-xl text-gray-400 font-light">Just ask me anything!</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your question..."
                  className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
                />
                <button
                  onClick={handleVoiceToggle}
                  className={`p-4 rounded-2xl transition-all ${
                    isListening
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Income Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <button className="p-2 bg-gray-50 rounded-full">
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-xs text-gray-500">Weekly ▾</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Total income</p>
                <p className="text-2xl font-semibold text-gray-900 mb-4">$ {(stats.totalRevenue / 1000).toFixed(1)}K</p>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Total paid</p>
                  <p className="text-lg font-semibold text-gray-900">$ 8,145.20</p>
                </div>
              </div>

              {/* System Lock Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-50 rounded-full">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button className="p-2 bg-gray-50 rounded-full">
                    <Clock className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">System Lock</p>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56 * 0.36} ${2 * Math.PI * 56}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">36%</p>
                      <p className="text-xs text-gray-500">Growth rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Days Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">Weekly ▾</span>
                </div>
                <p className="text-3xl font-semibold text-gray-900 mb-2">13 Days</p>
                <p className="text-xs text-gray-500 mb-4">109 hours, 23 minutes</p>
                <div className="flex gap-1">
                  {[...Array(31)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < 13 ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Revenue Chart Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">2022</span>
                  <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full">2023</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 mb-4">$ 16,073.49</p>
                <div className="h-16 flex items-end gap-1">
                  {[40, 60, 30, 70, 50, 80, 45, 90, 55, 75, 65, 85].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Manager */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Activity manager</h3>
                <div className="flex items-center gap-2">
                  <button className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full">
                    Team ×
                  </button>
                  <button className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full">
                    Insights ×
                  </button>
                  <button className="text-xs text-gray-500 px-3 py-1.5 bg-gray-50 rounded-full">
                    Today ×
                  </button>
                  <button className="p-2">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{task.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-3 space-y-6">
            {/* Annual Profits */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-gray-900">Annual profits</h3>
                <button className="text-xs text-gray-500">2023 ▾</button>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                {/* Concentric circles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 opacity-30"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 opacity-40"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 opacity-50"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">$ 4K</span>
                  </div>
                </div>
                {/* Labels */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                  <span className="text-xs text-gray-500">$ 14K</span>
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                  <span className="text-xs text-gray-500">$ 9.3K</span>
                </div>
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
                  <span className="text-xs text-gray-500">$ 6.8K</span>
                </div>
              </div>
            </div>

            {/* Main Stocks */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Main Stocks</p>
                  <p className="text-xs text-gray-500">Extended & Limited</p>
                </div>
                <button className="p-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </button>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-2xl font-semibold text-gray-900">$ 16,073</p>
                <span className="text-sm text-green-600">+ 9.3%</span>
              </div>
              <div className="h-20">
                <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                  <path
                    d="M 0,40 Q 25,50 50,45 T 100,35 T 150,30 T 200,25"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className="opacity-50"
                  />
                  <path
                    d="M 0,40 Q 25,35 50,30 T 100,25 T 150,20 T 200,15"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Wallet Verification */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 text-center mb-2">
                Wallet Verification
              </h3>
              <p className="text-xs text-gray-500 text-center mb-4">
                Enable 2-step verification to secure your wallet
              </p>
              <button className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-2xl py-3 text-sm font-medium hover:shadow-lg transition-shadow">
                Enable
              </button>
            </div>

            {/* Review Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  ))}
                </div>
                <button className="p-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">Review rating</p>
              <p className="text-sm font-medium text-gray-900 mb-4">
                How is your business management going?
              </p>
              <div className="flex gap-2">
                {['😞', '😐', '😊', '😄', '🤩'].map((emoji, i) => (
                  <button
                    key={i}
                    className="flex-1 aspect-square bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center text-2xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
