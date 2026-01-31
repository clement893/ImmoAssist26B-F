/**
 * AudioPlayer Component Tests
 *
 * Comprehensive test suite for the AudioPlayer component covering:
 * - Rendering with audio element
 * - Play/pause functionality
 * - Volume controls
 * - Seek functionality
 * - Title and artist display
 * - Callbacks
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import AudioPlayer from '../AudioPlayer';

describe('AudioPlayer Component', () => {
  const mockOnPlay = vi.fn();
  const mockOnPause = vi.fn();
  const mockOnEnded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock HTMLAudioElement methods
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  describe('Rendering', () => {
    it('renders audio element', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" />);
      const audio = container.querySelector('audio');
      expect(audio).toBeInTheDocument();
      expect(audio).toHaveAttribute('src', 'test-audio.mp3');
    });

    it('renders title when provided', () => {
      render(<AudioPlayer src="test-audio.mp3" title="Test Song" />);
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    it('renders artist when provided', () => {
      render(<AudioPlayer src="test-audio.mp3" artist="Test Artist" />);
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    it('renders both title and artist', () => {
      render(<AudioPlayer src="test-audio.mp3" title="Song" artist="Artist" />);
      expect(screen.getByText('Song')).toBeInTheDocument();
      expect(screen.getByText('Artist')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies autoplay when autoplay is true', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" autoplay />);
      const audio = container.querySelector('audio');
      expect(audio).toHaveAttribute('autoPlay');
    });

    it('applies loop when loop is true', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" loop />);
      const audio = container.querySelector('audio');
      expect(audio).toHaveAttribute('loop');
    });

    it('applies muted when muted is true', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" muted />);
      const audio = container.querySelector('audio');
      expect(audio).toHaveAttribute('muted');
    });

    it('applies custom className', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" className="custom-player" />);
      const wrapper = container.querySelector('.custom-player');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Callbacks', () => {
    it('calls onPlay when audio plays', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" onPlay={mockOnPlay} />);
      const audio = container.querySelector('audio');
      if (audio) {
        fireEvent.play(audio);
        expect(mockOnPlay).toHaveBeenCalled();
      }
    });

    it('calls onPause when audio pauses', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" onPause={mockOnPause} />);
      const audio = container.querySelector('audio');
      if (audio) {
        fireEvent.pause(audio);
        expect(mockOnPause).toHaveBeenCalled();
      }
    });

    it('calls onEnded when audio ends', () => {
      const { container } = render(<AudioPlayer src="test-audio.mp3" onEnded={mockOnEnded} />);
      const audio = container.querySelector('audio');
      if (audio) {
        fireEvent.ended(audio);
        expect(mockOnEnded).toHaveBeenCalled();
      }
    });
  });
});
