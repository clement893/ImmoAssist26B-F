'use client';

import { useState } from 'react';
import {
  Users,
  Building2,
  Receipt,
  TrendingUp,
  Calendar as CalendarIcon,
  Video,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function DemoDashboard() {
  const [currentDate] = useState(new Date());

  // Mock data
  const stats = [
    {
      title: 'Total Transactions',
      value: '24',
      change: '+12%',
      icon: Receipt,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Active Clients',
      value: '156',
      change: '+8%',
      icon: Users,
      color: 'bg-green-500',
      lightBg: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Properties Listed',
      value: '42',
      change: '+5%',
      icon: Building2,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Revenue',
      value: '$125K',
      change: '+18%',
      icon: TrendingUp,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
  ];

  const todayAgenda = [
    {
      title: 'Morning stand-up',
      time: '9:00 - 9:15',
      status: 'upcoming',
      color: 'bg-blue-500',
    },
    {
      title: 'Property viewing - 123 Main St',
      time: '10:00 - 10:30',
      status: 'upcoming',
      color: 'bg-green-500',
    },
    {
      title: 'Client meeting - Smith family',
      time: '13:00 - 14:45',
      status: 'upcoming',
      color: 'bg-purple-500',
    },
    {
      title: 'Contract signing',
      time: '15:00 - 15:30',
      status: 'upcoming',
      color: 'bg-amber-500',
    },
  ];

  const invitations = [
    {
      name: 'Sarah Johnson',
      event: 'Q4 Planning Meeting',
      avatar: 'SJ',
      color: 'bg-pink-500',
    },
    {
      name: 'Michael Chen',
      event: 'Property Showcase',
      avatar: 'MC',
      color: 'bg-blue-500',
    },
    {
      name: 'Emma Wilson',
      event: 'Team Brainstorming',
      avatar: 'EW',
      color: 'bg-green-500',
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth();
  const today = currentDate.getDate();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Good morning, John!</h1>
        <p className="mt-2 text-lg text-slate-600">{formatDate(currentDate)}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-md hover:ring-slate-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-2 flex items-center text-sm font-medium text-green-600">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`rounded-xl ${stat.lightBg} p-3`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Agenda & Calendar */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Agenda */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Your agenda today</h2>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                + Add Event
              </button>
            </div>
            <div className="space-y-4">
              {todayAgenda.map((event, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <div className={`h-12 w-1 rounded-full ${event.color}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <p className="mt-1 flex items-center text-sm text-slate-600">
                      <Clock className="mr-1.5 h-4 w-4" />
                      {event.time}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                      Reschedule
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                      Change attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-sm font-semibold text-slate-600">
                  {day}
                </div>
              ))}
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`flex h-12 items-center justify-center rounded-lg text-sm transition-colors ${
                    day === null
                      ? ''
                      : day === today
                        ? 'bg-indigo-600 font-bold text-white'
                        : day === 7
                          ? 'bg-indigo-50 font-semibold text-indigo-700 ring-2 ring-indigo-600'
                          : 'cursor-pointer font-medium text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Invitations */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Quick Actions</h2>
              <p className="mt-2 text-sm text-indigo-100">Start your day efficiently</p>
            </div>
            <div className="space-y-3">
              <button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="rounded-lg bg-white/20 p-2">
                  <Video className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Start a meeting</div>
                  <div className="text-xs text-indigo-100">Begin instant video call</div>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="rounded-lg bg-white/20 p-2">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Join a meeting</div>
                  <div className="text-xs text-indigo-100">Enter meeting code</div>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="rounded-lg bg-white/20 p-2">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Schedule a meeting</div>
                  <div className="text-xs text-indigo-100">Plan for later</div>
                </div>
              </button>
            </div>
          </div>

          {/* Invitations */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Invitations</h2>
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${invitation.color} text-sm font-bold text-white`}>
                    {invitation.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{invitation.name}</p>
                    <p className="text-xs text-slate-600">{invitation.event}</p>
                  </div>
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                    RSVP
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Insights</h2>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Meetings hosted this week</p>
                  <p className="text-3xl font-bold text-indigo-600">8</p>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Meetings attended this week</p>
                  <p className="text-3xl font-bold text-blue-600">16</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
