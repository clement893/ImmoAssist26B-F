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
  Star,
  Flame,
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  Heart,
  MessageCircle,
  Bell,
  Search,
} from 'lucide-react';

export default function DashboardV2() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data
  const stats = {
    transactions: 24,
    activeDeals: 8,
    totalRevenue: 485000,
    clients: 156,
    streak: 12,
    level: 7,
    xp: 2450,
    nextLevelXp: 3000,
  };

  const achievements = [
    { id: 1, title: 'Deal Master', icon: Trophy, color: 'text-yellow-500', unlocked: true },
    { id: 2, title: 'Client Favorite', icon: Heart, color: 'text-pink-500', unlocked: true },
    { id: 3, title: '10 Day Streak', icon: Flame, color: 'text-orange-500', unlocked: true },
    { id: 4, title: 'Top Performer', icon: Star, color: 'text-purple-500', unlocked: false },
  ];

  const recentActivity = [
    { id: 1, action: 'New deal closed', client: 'Sarah Johnson', amount: '$450,000', time: '2h ago', type: 'success' },
    { id: 2, action: 'Meeting scheduled', client: 'Michael Chen', time: '4h ago', type: 'info' },
    { id: 3, action: 'Document signed', client: 'Emma Wilson', time: '1d ago', type: 'success' },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Property viewing with Alex', time: 'Today, 2:00 PM', priority: 'high' },
    { id: 2, title: 'Contract review meeting', time: 'Today, 4:30 PM', priority: 'medium' },
    { id: 3, title: 'Follow-up call with Lisa', time: 'Tomorrow, 10:00 AM', priority: 'low' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header with Search and Notifications */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome back, John! 👋
            </h1>
            <p className="text-gray-600 font-light">
              You're doing amazing! Keep up the great work.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="pl-12 pr-6 py-3 bg-white rounded-xl shadow-sm text-sm font-light text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-light">Level {stats.level} Agent</p>
                <p className="text-white text-xl font-bold">{stats.xp} / {stats.nextLevelXp} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="text-white font-bold">{stats.streak} day streak!</span>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${(stats.xp / stats.nextLevelXp) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +12%
            </span>
          </div>
          <p className="text-gray-500 text-sm font-light mb-1">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.transactions}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-light">8 active deals</p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 shadow-lg shadow-green-500/30">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +24%
            </span>
          </div>
          <p className="text-gray-500 text-sm font-light mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-light">This month</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-3 shadow-lg shadow-purple-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +8%
            </span>
          </div>
          <p className="text-gray-500 text-sm font-light mb-1">Active Clients</p>
          <p className="text-3xl font-bold text-gray-900">{stats.clients}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-light">12 new this week</p>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3 shadow-lg shadow-orange-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +5%
            </span>
          </div>
          <p className="text-gray-500 text-sm font-light mb-1">Properties Listed</p>
          <p className="text-3xl font-bold text-gray-900">42</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-light">6 pending approval</p>
          </div>
        </div>
      </div>

      {/* Achievements and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Achievements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl p-4 text-center transition-all duration-200 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-md cursor-pointer'
                      : 'bg-gray-50 opacity-50'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${achievement.color}`} />
                  <p className="text-xs font-medium text-gray-700">{achievement.title}</p>
                  {achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                  }`}
                >
                  {activity.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Calendar className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.client}</p>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="text-sm font-bold text-green-600">{activity.amount}</p>
                  )}
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Upcoming Tasks</h3>
          <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
            View all
          </button>
        </div>
        <div className="space-y-3">
          {upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
            >
              <div
                className={`w-1 h-12 rounded-full ${
                  task.priority === 'high'
                    ? 'bg-red-500'
                    : task.priority === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
              ></div>
              <Clock className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-500">{task.time}</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <CheckCircle2 className="w-5 h-5 text-gray-400 hover:text-green-600" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
