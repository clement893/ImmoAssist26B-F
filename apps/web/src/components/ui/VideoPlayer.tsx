'use client';
import { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { clsx } from 'clsx';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from '@/lib/icons';
import Button from './Button';
export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}
export default function VideoPlayer({
  src,
  poster,
  title,
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  className,
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onPlay, onPause, onEnded]);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      video.volume = 0.5;
    }
  };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    video.muted = newVolume === 0;
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) {
      video.requestFullscreen().catch((err) => {
        logger.error('', 'Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div
      className={clsx('relative bg-foreground rounded-lg overflow-hidden group', className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {' '}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        loop={loop}
        muted={isMuted}
        autoPlay={autoplay}
      />{' '}
      {title && (
        <div className="absolute top-4 left-4 right-4">
          {' '}
          <h3 className="text-background text-lg font-semibold drop-shadow-lg">{title}</h3>{' '}
        </div>
      )}{' '}
      {controls && (
        <div
          className={clsx(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          {' '}
          {/* Progress bar */}{' '}
          <div className="mb-4">
            {' '}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Video progress"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={currentTime}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
              className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary-500"
            />{' '}
          </div>{' '}
          {/* Controls */}{' '}
          <div className="flex items-center gap-4">
            {' '}
            <div className="flex items-center gap-2">
              {' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
                className="text-background hover:bg-background/20"
              >
                {' '}
                {isPlaying ? (
                  <Pause className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Play className="w-5 h-5" aria-hidden="true" />
                )}{' '}
              </Button>{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(-10)}
                aria-label="Rewind 10 seconds"
                className="text-background hover:bg-background/20"
              >
                {' '}
                <SkipBack className="w-4 h-4" aria-hidden="true" />{' '}
              </Button>{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(10)}
                aria-label="Forward 10 seconds"
                className="text-background hover:bg-background/20"
              >
                {' '}
                <SkipForward className="w-4 h-4" aria-hidden="true" />{' '}
              </Button>{' '}
              <div className="text-background text-sm">
                {' '}
                {formatTime(currentTime)} / {formatTime(duration)}{' '}
              </div>{' '}
            </div>{' '}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {' '}
              <div className="flex items-center gap-2">
                {' '}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  className="text-background hover:bg-background/20"
                >
                  {' '}
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-5 h-5" aria-hidden="true" />
                  )}{' '}
                </Button>{' '}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume control"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={volume}
                  aria-valuetext={`${Math.round(volume * 100)}%`}
                  className="w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary-500"
                />{' '}
              </div>{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="text-background hover:bg-background/20"
              >
                {' '}
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Maximize className="w-5 h-5" aria-hidden="true" />
                )}{' '}
              </Button>{' '}
            </div>{' '}
          </div>{' '}
        </div>
      )}{' '}
    </div>
  );
}
