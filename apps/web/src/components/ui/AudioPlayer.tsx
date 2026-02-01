'use client';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import Button from './Button';
export interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}
export default function AudioPlayer({
  src,
  title,
  artist,
  autoplay = false,
  loop = false,
  muted = false,
  className,
  onPlay,
  onPause,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
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
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlay, onPause, onEnded]);
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !isMuted;
    audio.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      audio.volume = 0.5;
    }
  };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    audio.muted = newVolume === 0;
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className={clsx('bg-background rounded-lg border border-border p-4 shadow-subtle-sm transition-modern', className)}> {/* UI Revamp - Ombres subtiles et transition moderne */}
      {' '}
      <audio ref={audioRef} src={src} loop={loop} muted={isMuted} autoPlay={autoplay} />{' '}
      {/* Title and Artist */}{' '}
      {(title || artist) && (
        <div className="mb-4">
          {' '}
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}{' '}
          {artist && <p className="text-sm text-muted-foreground">{artist}</p>}{' '}
        </div>
      )}{' '}
      {/* Progress bar */}{' '}
      <div className="mb-4">
        {' '}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary-500 transition-modern" // UI Revamp - Transition moderne
        />{' '}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          {' '}
          <span>{formatTime(currentTime)}</span> <span>{formatTime(duration)}</span>{' '}
        </div>{' '}
      </div>{' '}
      {/* Controls */}{' '}
      <div className="flex items-center gap-4">
        {' '}
        <div className="flex items-center gap-2">
          {' '}
          <Button variant="primary" size="sm" onClick={togglePlay} className="rounded-full p-2">
            {' '}
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}{' '}
          </Button>{' '}
          <Button variant="ghost" size="sm" onClick={() => skip(-10)} className="rounded-full p-2">
            {' '}
            <SkipBack className="w-4 h-4" />{' '}
          </Button>{' '}
          <Button variant="ghost" size="sm" onClick={() => skip(10)} className="rounded-full p-2">
            {' '}
            <SkipForward className="w-4 h-4" />{' '}
          </Button>{' '}
        </div>{' '}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {' '}
          <Button variant="ghost" size="sm" onClick={toggleMute} className="rounded-full p-2">
            {' '}
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}{' '}
          </Button>{' '}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary-500"
          />{' '}
        </div>{' '}
      </div>{' '}
    </div>
  );
}
