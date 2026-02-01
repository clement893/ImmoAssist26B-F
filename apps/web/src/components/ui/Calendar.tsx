'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Button from './Button';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  color?: string;
  description?: string;
}

export type CalendarView = 'month' | 'day';

export interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
  view?: CalendarView;
  defaultView?: CalendarView;
}

export default function Calendar({ 
  events = [], 
  onDateClick, 
  onEventClick, 
  className,
  view: controlledView,
  defaultView = 'month'
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [internalView, setInternalView] = useState<CalendarView>(defaultView);
  
  const view = controlledView || internalView;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const dayNamesShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const dayNamesFull = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Generate days for the day selector (7 days around selected date)
  const getDaySelectorDays = () => {
    const days = [];
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 3); // Show 3 days before
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // Get events for selected day
  const getEventsForSelectedDay = () => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  // Format time for timeline
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  };

  // Get hour from time string or date
  const getHour = (time?: string | Date) => {
    if (!time) return 0;
    if (time instanceof Date) {
      return time.getHours() + time.getMinutes() / 60;
    }
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) + (minutes || 0) / 60;
  };

  // Generate timeline hours (6 AM to 11 PM)
  const timelineHours = Array.from({ length: 18 }, (_, i) => i + 6);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Days of the month - Style démo pages (ultra-minimaliste)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isCurrentDay = isToday(date);

      days.push(
        <button
          key={day}
          onClick={() => onDateClick?.(date)}
          className={clsx(
            'aspect-square flex items-center justify-center text-sm font-light rounded-full transition-all duration-200', // UI Revamp - Style démo pages
            isCurrentDay
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' // UI Revamp - Jour actuel avec ombre colorée
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            dayEvents.length > 0 && !isCurrentDay && 'font-medium' // Indiquer les jours avec événements
          )}
          title={dayEvents.length > 0 ? `${dayEvents.length} événement(s)` : undefined}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForSelectedDay();

    return (
      <div className="space-y-4">
        {/* Day Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {getDaySelectorDays().map((date, index) => {
            const isSelected = 
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear();
            const isCurrentDay = isToday(date);
            const dayNumber = date.getDate();
            const dayName = dayNamesShort[date.getDay()];

            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(date);
                  setCurrentDate(date);
                  onDateClick?.(date);
                }}
                className={clsx(
                  'flex flex-col items-center justify-center min-w-[60px] px-4 py-3 rounded-lg transition-modern', // UI Revamp - Transition moderne
                  'hover:bg-slate-700 dark:hover:bg-slate-700',
                  isSelected
                    ? 'bg-blue-600 text-white shadow-standard-lg scale-105' // UI Revamp - Nouveau système d'ombres
                    : isCurrentDay
                      ? 'bg-slate-700 text-slate-100'
                      : 'bg-slate-800 text-slate-300'
                )}
              >
                <span className="text-xs font-medium uppercase mb-1">{dayName}</span>
                <span className="text-lg font-bold">{dayNumber}</span>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="flex gap-4">
          {/* Hours column */}
          <div className="flex flex-col w-16 flex-shrink-0">
            {timelineHours.map((hour) => (
              <div
                key={hour}
                className="h-16 flex items-start justify-end pr-2 text-xs text-muted-foreground border-r border-border"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1 relative">
            {timelineHours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-border"
              />
            ))}
            
            {/* Events */}
            {dayEvents.map((event) => {
              const eventDate = new Date(event.date);
              const eventHour = event.time ? getHour(event.time) : eventDate.getHours() + eventDate.getMinutes() / 60;
              
              // Calculate position and height
              const startHour = Math.max(6, Math.min(eventHour, 24));
              const endHour = Math.min(startHour + 1, 24); // Default 1 hour duration
              const duration = endHour - startHour;
              
              const topPosition = ((startHour - 6) / 18) * 100;
              const height = (duration / 18) * 100;

              // Determine color based on event category or use default
              const eventColor = event.color || 'bg-blue-500';
              const eventTextColor = 'text-white';

              return (
                <div
                  key={event.id}
                  className={clsx(
                    'absolute left-0 right-0 rounded-lg p-2 cursor-pointer shadow-standard-md', // UI Revamp - Nouveau système d'ombres
                    'hover:shadow-standard-lg transition-modern border-l-4', // UI Revamp - Transition moderne
                    eventColor,
                    eventTextColor
                  )}
                  style={{
                    top: `${topPosition}%`,
                    height: `${Math.max(height, 5)}%`,
                    minHeight: '40px',
                  }}
                  onClick={() => onEventClick?.(event)}
                  title={event.title}
                >
                  <div className="text-xs font-semibold truncate mb-1">
                    {event.time || formatTime(eventDate)}
                  </div>
                  <div className="text-sm font-bold truncate">{event.title}</div>
                  {event.description && (
                    <div className="text-xs opacity-90 truncate mt-1">{event.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={clsx('bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-sm', className)}> {/* UI Revamp - Style démo pages */}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {view === 'day' ? (
          <h2 className="text-lg font-normal text-gray-900 dark:text-neutral-100">
            {dayNamesFull[selectedDate.getDay()]}, {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
          </h2>
        ) : (
          <h2 className="text-lg font-normal text-gray-900 dark:text-neutral-100">
            {monthNames[month]} {year}
          </h2>
        )}
        <div className="flex gap-2">
          {view === 'day' ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => {
                const prevDay = new Date(selectedDate);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDate(prevDay);
                setCurrentDate(prevDay);
              }}>
                ‹
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                const nextDay = new Date(selectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelectedDate(nextDay);
                setCurrentDate(nextDay);
              }}>
                ›
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                ‹
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                ›
              </Button>
            </>
          )}
          {!controlledView && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setInternalView(view === 'day' ? 'month' : 'day')}
            >
              {view === 'day' ? 'Mois' : 'Jour'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'day' ? (
        renderDayView()
      ) : (
        <>
          {/* Day names - Style démo pages */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-light text-gray-500 dark:text-gray-400 pb-2">
                {day.charAt(0)} {/* UI Revamp - Première lettre seulement comme démo */}
              </div>
            ))}
          </div>

          {/* Calendar grid - Style démo pages */}
          <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
        </>
      )}
    </div>
  );
}
