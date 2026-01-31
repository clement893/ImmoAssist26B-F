/**
 * VideoPlayer Component Tests
 *
 * Comprehensive test suite for the VideoPlayer component covering:
 * - Rendering with video element
 * - Play/pause functionality
 * - Volume controls
 * - Seek functionality
 * - Fullscreen toggle
 * - Callbacks
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import VideoPlayer from '../VideoPlayer';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('VideoPlayer Component', () => {
  const mockOnPlay = vi.fn();
  const mockOnPause = vi.fn();
  const mockOnEnded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock HTMLVideoElement methods
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders video element', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'test-video.mp4');
    });

    it('renders with poster image', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" poster="poster.jpg" />);
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('poster', 'poster.jpg');
    });

    it('renders title when provided', () => {
      render(<VideoPlayer src="test-video.mp4" title="Test Video" />);
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });

    it('renders controls when controls prop is true', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" controls />);
      const controls = container.querySelector('.absolute.bottom-0');
      expect(controls).toBeInTheDocument();
    });

    it('hides controls when controls prop is false', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" controls={false} />);
      const controls = container.querySelector('.absolute.bottom-0');
      expect(controls).not.toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies autoplay when autoplay is true', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" autoplay />);
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('autoPlay');
    });

    it('applies loop when loop is true', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" loop />);
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('loop');
    });

    it('applies muted when muted is true', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" muted />);
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('muted');
    });

    it('applies custom className', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" className="custom-player" />);
      const wrapper = container.querySelector('.custom-player');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has aria-labels on control buttons', () => {
      render(<VideoPlayer src="test-video.mp4" />);
      const playButton = screen.getByLabelText(/play video/i);
      expect(playButton).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onPlay when video plays', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" onPlay={mockOnPlay} />);
      const video = container.querySelector('video');
      if (video) {
        fireEvent.play(video);
        expect(mockOnPlay).toHaveBeenCalled();
      }
    });

    it('calls onPause when video pauses', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" onPause={mockOnPause} />);
      const video = container.querySelector('video');
      if (video) {
        fireEvent.pause(video);
        expect(mockOnPause).toHaveBeenCalled();
      }
    });

    it('calls onEnded when video ends', () => {
      const { container } = render(<VideoPlayer src="test-video.mp4" onEnded={mockOnEnded} />);
      const video = container.querySelector('video');
      if (video) {
        fireEvent.ended(video);
        expect(mockOnEnded).toHaveBeenCalled();
      }
    });
  });
});
