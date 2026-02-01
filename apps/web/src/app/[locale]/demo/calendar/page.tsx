'use client';

import { useState } from 'react';
import {
  Video,
  UserPlus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function DemoCalendar() {
  const [currentDate] = useState(new Date(2023, 7, 7)); // August 7, 2023
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const todayAgenda = [
    {
      title: 'Morning stand-up',
      time: '9:00 - 9:15',
    },
    {
      title: 'Property viewing',
      time: '10:00 - 10:30',
    },
    {
      title: 'Client consultation',
      time: '13:00 - 14:45',
    },
    {
      title: 'Contract review',
      time: '15:00 - 15:30',
    },
  ];

  const invitations = [
    {
      name: 'Samson',
      event: 'Q4 planning',
      avatar: 'S',
      color: 'bg-blue-500',
    },
    {
      name: 'Lena',
      event: 'Breakfast!!!',
      avatar: 'L',
      color: 'bg-green-500',
    },
    {
      name: 'Dominic',
      event: 'Brainstorming',
      avatar: 'D',
      color: 'bg-purple-500',
    },
  ];

  const insights = [
    {
      label: 'Number of meetings you hosted this week',
      value: '8',
    },
    {
      label: 'Number of meetings you hosted this month',
      value: '16',
    },
  ];

  // Calendar data
  const daysInMonth = 31;
  const firstDayOfMonth = 3; // Wednesday
  const today = 7;

  return (
    <div className="min-h-screen p-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          Good morning, John!
        </h1>
        <p className="text-sm font-light text-gray-500">
          Manage your schedule and meetings
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Agenda & Calendar */}
        <div className="lg:col-span-2 space-y-8">
          {/* Your agenda today */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-light text-gray-900 mb-6">Your agenda today:</h2>
            <div className="space-y-4">
              {todayAgenda.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-normal text-gray-900 mb-1">{item.title}</p>
                    <p className="text-xs font-light text-gray-500">{item.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-500 text-white text-xs font-light rounded-xl hover:bg-blue-600 transition-colors">
                      Reschedule
                    </button>
                    <button className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-light rounded-xl hover:bg-gray-50 transition-colors">
                      Change attendance
                    </button>
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
                      <p className="text-sm font-normal text-gray-900">{invitation.name} invited you to</p>
                      <p className="text-xs font-light text-blue-500">{invitation.event}</p>
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
                  <p className="text-xs font-light text-gray-500 mb-2">{insight.label}</p>
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
