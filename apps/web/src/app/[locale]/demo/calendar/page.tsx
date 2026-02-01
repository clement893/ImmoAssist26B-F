'use client';

import { useState } from 'react';
import {
  Video,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function DemoCalendar() {
  const [currentDate] = useState(new Date(2023, 7, 7)); // August 7, 2023

  const todayAgenda = [
    {
      title: 'Morning stand-up',
      time: '9:00 - 9:15',
      color: 'bg-blue-500',
    },
    {
      title: 'Property viewing - Downtown Condo',
      time: '10:00 - 10:30',
      color: 'bg-green-500',
    },
    {
      title: 'Client consultation - Smith Family',
      time: '13:00 - 14:45',
      color: 'bg-purple-500',
    },
    {
      title: 'Contract review meeting',
      time: '15:00 - 15:30',
      color: 'bg-amber-500',
    },
  ];

  const invitations = [
    {
      name: 'Samson',
      event: 'Q4 planning',
      avatar: 'S',
      color: 'bg-pink-500',
    },
    {
      name: 'Lena',
      event: 'Breakfast!!!',
      avatar: 'L',
      color: 'bg-blue-500',
    },
    {
      name: 'Dominic',
      event: 'Brainstorming',
      avatar: 'D',
      color: 'bg-green-500',
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
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Good morning, John!</h1>
        <p className="mt-2 text-lg text-slate-600">
          {currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left & Center Column - Agenda & Calendar */}
        <div className="space-y-8 lg:col-span-2">
          {/* Today's Agenda */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Your agenda today:</h2>
            <div className="space-y-4">
              {todayAgenda.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900">{event.title}</h3>
                      <p className="mt-1 flex items-center text-sm text-slate-600">
                        <Clock className="mr-1.5 h-4 w-4" />
                        {event.time}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
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
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                  <CalendarIcon className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
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
                        : day === 1 || day === 2 || day === 3
                          ? 'font-medium text-slate-400'
                          : 'cursor-pointer font-medium text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Invitations */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white shadow-lg">
            <div className="mb-6">
              <div className="mb-2 inline-block rounded-full bg-white/20 p-3">
                <Video className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">Quick Actions</h2>
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
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${invitation.color} text-sm font-bold text-white`}
                  >
                    {invitation.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{invitation.name} invited you to</p>
                    <p className="text-sm font-bold text-indigo-600">{invitation.event}</p>
                  </div>
                  <button className="flex-shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
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
                <p className="mb-2 text-sm font-medium text-slate-600">Number of meetings you hosted this week</p>
                <p className="text-5xl font-bold text-indigo-600">8</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-600">Number of meetings you hosted this week</p>
                <p className="text-5xl font-bold text-blue-600">16</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
