'use client';

import { useState } from 'react';
import {
  Users,
  Building2,
  Receipt,
  TrendingUp,
  Video,
  UserPlus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function DemoDashboard() {
  const [currentDate] = useState(new Date());
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Mock data - Stats
  const stats = [
    {
      title: 'Total Transactions',
      value: '24',
      subtitle: 'Active deals',
      icon: Receipt,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Clients',
      value: '156',
      subtitle: '+12 this week',
      icon: Users,
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Properties',
      value: '42',
      subtitle: '8 new listings',
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Revenue',
      value: '$125K',
      subtitle: '+18% from last month',
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  // Mock data - Today's Agenda
  const agenda = [
    {
      title: 'Property viewing',
      time: '9:00 - 10:00',
      client: 'Sarah Johnson',
      type: 'Meeting',
    },
    {
      title: 'Contract signing',
      time: '11:00 - 11:30',
      client: 'Mike Peters',
      type: 'Appointment',
    },
    {
      title: 'Team standup',
      time: '14:00 - 14:30',
      client: 'Internal',
      type: 'Meeting',
    },
    {
      title: 'Client consultation',
      time: '16:00 - 17:00',
      client: 'Emma Wilson',
      type: 'Call',
    },
  ];

  // Mock data - Invitations
  const invitations = [
    {
      name: 'John Smith',
      event: 'Q1 Planning Meeting',
      avatar: 'JS',
      color: 'bg-blue-500',
    },
    {
      name: 'Lisa Anderson',
      event: 'Property Showcase',
      avatar: 'LA',
      color: 'bg-green-500',
    },
    {
      name: 'David Chen',
      event: 'Contract Review',
      avatar: 'DC',
      color: 'bg-purple-500',
    },
  ];

  // Mock data - Insights
  const insights = [
    {
      label: 'Meetings hosted',
      value: '8',
      period: 'this week',
    },
    {
      label: 'Deals closed',
      value: '16',
      period: 'this month',
    },
  ];

  // Calendar data
  const daysInMonth = 31;
  const firstDayOfMonth = 5; // Friday
  const today = 7;

  return (
    <div className="min-h-screen p-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          Good morning, John!
        </h1>
        <p className="text-sm font-light text-gray-500">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`${stat.iconBg} rounded-xl p-3`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-light text-gray-500 mb-2">{stat.title}</p>
                <p className="text-3xl font-light text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs font-light text-gray-400">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Agenda & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Your agenda today */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-light text-gray-900 mb-6">Your agenda today:</h2>
            <div className="space-y-4">
              {agenda.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-normal text-gray-900 mb-1">{item.title}</p>
                    <p className="text-xs font-light text-gray-500">{item.client}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-light text-gray-600">{item.time}</span>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-500 text-white text-xs font-light rounded-xl hover:bg-blue-600 transition-colors">
                        Reschedule
                      </button>
                      <button className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-light rounded-xl hover:bg-gray-50 transition-colors">
                        Change attendance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div key={index} className="text-center text-xs font-light text-gray-500 pb-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: firstDayOfMonth - 1 }).map((_, index) => (
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
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
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

        {/* Right Column - Quick Actions, Invitations, Insights */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
            <button className="w-full flex items-center gap-4 p-6 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              <div className="bg-blue-500 rounded-full p-3">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-normal text-gray-900">Start a meeting</span>
            </button>
            <button className="w-full flex items-center gap-4 p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <div className="bg-blue-500 rounded-full p-3">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-normal text-gray-900">Join a meeting</span>
            </button>
            <button className="w-full flex items-center gap-4 p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <div className="bg-blue-500 rounded-full p-3">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-normal text-gray-900">Schedule a meeting</span>
            </button>
          </div>

          {/* Invitations */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-normal text-gray-900 mb-6">Invitations</h3>
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${invitation.color} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-light`}>
                      {invitation.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-normal text-gray-900">{invitation.name}</p>
                      <p className="text-xs font-light text-gray-500">{invitation.event}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white text-xs font-light rounded-xl hover:bg-blue-600 transition-colors">
                    RSVP
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-normal text-gray-900 mb-6">Insights</h3>
            <div className="space-y-6">
              {insights.map((insight, index) => (
                <div key={index}>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-xs font-light text-gray-500">{insight.label}</p>
                    <p className="text-xs font-light text-gray-400">{insight.period}</p>
                  </div>
                  <p className="text-4xl font-light text-blue-500">{insight.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
