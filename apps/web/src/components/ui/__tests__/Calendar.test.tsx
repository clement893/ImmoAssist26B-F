/**
 * Calendar Component Tests
 *
 * Comprehensive test suite for the Calendar component covering:
 * - Rendering calendar grid
 * - Month navigation
 * - Date selection
 * - Event display
 * - Today highlighting
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import Calendar from '../Calendar';
import type { CalendarEvent } from '../Calendar';

describe('Calendar Component', () => {
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Event 1',
      date: new Date(2024, 0, 15), // January 15, 2024
      color: '#FF0000',
    },
    {
      id: '2',
      title: 'Event 2',
      date: new Date(2024, 0, 15), // Same day
      time: '10:00',
    },
    {
      id: '3',
      title: 'Event 3',
      date: new Date(2024, 0, 20), // January 20, 2024
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to January 2024 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders calendar with current month', () => {
      render(<Calendar />);
      expect(screen.getByText(/Janvier/i)).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('renders day names', () => {
      render(<Calendar />);
      expect(screen.getByText('Dim')).toBeInTheDocument();
      expect(screen.getByText('Lun')).toBeInTheDocument();
      expect(screen.getByText('Sam')).toBeInTheDocument();
    });

    it('renders calendar days', () => {
      render(<Calendar />);
      // Should render days 1-31 for January
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    it('renders empty cells for days before month starts', () => {
      const { container } = render(<Calendar />);
      // January 2024 starts on Monday (day 1), so there should be empty cells
      const emptyCells = container.querySelectorAll('.aspect-square:empty');
      expect(emptyCells.length).toBeGreaterThan(0);
    });
  });

  describe('Month Navigation', () => {
    it('navigates to previous month', () => {
      render(<Calendar />);

      const prevButton = screen.getByText('‹');
      fireEvent.click(prevButton);

      expect(screen.getByText(/Décembre/i)).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('navigates to next month', () => {
      render(<Calendar />);

      const nextButton = screen.getByText('›');
      fireEvent.click(nextButton);

      expect(screen.getByText(/Février/i)).toBeInTheDocument();
    });

    it('navigates to today', () => {
      render(<Calendar />);

      // Navigate away first
      const nextButton = screen.getByText('›');
      fireEvent.click(nextButton);

      // Then go to today
      const todayButton = screen.getByText("Aujourd'hui");
      fireEvent.click(todayButton);

      expect(screen.getByText(/Janvier/i)).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
    });

    it('handles year transition when going to previous month', () => {
      render(<Calendar />);

      // Set to January 2024
      const prevButton = screen.getByText('‹');
      fireEvent.click(prevButton);

      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('handles year transition when going to next month', () => {
      // Set to December 2024
      vi.setSystemTime(new Date(2024, 11, 15));
      render(<Calendar />);

      const nextButton = screen.getByText('›');
      fireEvent.click(nextButton);

      expect(screen.getByText('2025')).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('calls onDateClick when date is clicked', () => {
      const handleDateClick = vi.fn();
      render(<Calendar onDateClick={handleDateClick} />);

      const day15 = screen.getByText('15');
      fireEvent.click(day15.closest('div')!);

      expect(handleDateClick).toHaveBeenCalled();
      const clickedDate = handleDateClick.mock.calls[0][0];
      expect(clickedDate.getDate()).toBe(15);
      expect(clickedDate.getMonth()).toBe(0); // January
    });
  });

  describe('Event Display', () => {
    it('displays events on correct dates', () => {
      render(<Calendar events={mockEvents} />);
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
      expect(screen.getByText('Event 3')).toBeInTheDocument();
    });

    it('displays multiple events on same day', () => {
      render(<Calendar events={mockEvents} />);
      // Both Event 1 and Event 2 are on January 15
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    it('shows "+X autres" when more than 3 events on a day', () => {
      const manyEvents: CalendarEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        title: `Event ${i + 1}`,
        date: new Date(2024, 0, 15),
      }));

      render(<Calendar events={manyEvents} />);
      expect(screen.getByText(/\+2 autres/i)).toBeInTheDocument();
    });

    it('calls onEventClick when event is clicked', () => {
      const handleEventClick = vi.fn();
      render(<Calendar events={mockEvents} onEventClick={handleEventClick} />);

      const event1 = screen.getByText('Event 1');
      fireEvent.click(event1);

      expect(handleEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('applies custom event color', () => {
      render(<Calendar events={mockEvents} />);
      const event1 = screen.getByText('Event 1').closest('div');
      expect(event1).toHaveStyle({ backgroundColor: '#FF0000' });
    });
  });

  describe('Today Highlighting', () => {
    it("highlights today's date", () => {
      render(<Calendar />);
      const today = screen.getByText('10').closest('div');
      expect(today).toHaveClass('bg-primary-50');
    });

    it('does not highlight other dates', () => {
      render(<Calendar />);
      const day15 = screen.getByText('15').closest('div');
      expect(day15).not.toHaveClass('bg-primary-50');
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      const wrapper = container.querySelector('.custom-calendar');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Calendar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty events array', () => {
      render(<Calendar events={[]} />);
      expect(screen.getByText(/Janvier/i)).toBeInTheDocument();
    });

    it('handles events in different months', () => {
      const eventsInDifferentMonths: CalendarEvent[] = [
        { id: '1', title: 'Jan Event', date: new Date(2024, 0, 15) },
        { id: '2', title: 'Feb Event', date: new Date(2024, 1, 15) },
      ];

      render(<Calendar events={eventsInDifferentMonths} />);
      expect(screen.getByText('Jan Event')).toBeInTheDocument();

      // Navigate to February
      const nextButton = screen.getByText('›');
      fireEvent.click(nextButton);

      expect(screen.getByText('Feb Event')).toBeInTheDocument();
    });

    it('handles leap year February', () => {
      vi.setSystemTime(new Date(2024, 1, 15)); // February 2024 (leap year)
      render(<Calendar />);
      expect(screen.getByText('29')).toBeInTheDocument();
    });

    it('handles non-leap year February', () => {
      vi.setSystemTime(new Date(2023, 1, 15)); // February 2023 (non-leap year)
      render(<Calendar />);
      expect(screen.queryByText('29')).not.toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
    });
  });
});
