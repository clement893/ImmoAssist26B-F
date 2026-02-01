'use client';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Clock } from 'lucide-react';
import Input from './Input';
export interface TimePickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (time: string) => void;
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  format?: '12h' | '24h';
  className?: string;
}
export default function TimePicker({
  value: controlledValue,
  defaultValue = '',
  onChange,
  label,
  disabled = false,
  fullWidth = false,
  format = '24h',
  className,
}: TimePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  const formatTime = (hours: number, minutes: number): string => {
    if (format === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
    if (!timeStr) return null;
    if (format === '12h') {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match || !match[1] || !match[2] || !match[3]) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    }
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match || !match[1] || !match[2]) return null;
    return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
  };
  const currentTime = parseTime(currentValue) || { hours: 12, minutes: 0 };
  const handleTimeSelect = (hours: number, minutes: number) => {
    const newTime = formatTime(hours, minutes);
    if (!isControlled) {
      setInternalValue(newTime);
    }
    onChange?.(newTime);
    setIsOpen(false);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (!isControlled) {
      setInternalValue(newTime);
    }
    onChange?.(newTime);
  };
  const generateHours = () => {
    if (format === '12h') {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    return Array.from({ length: 24 }, (_, i) => i);
  };
  const generateMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i);
  };
  return (
    <div className={clsx('relative', fullWidth && 'w-full', className)} ref={pickerRef}>
      {' '}
      <Input
        type="text"
        value={currentValue}
        onChange={handleInputChange}
        onFocus={() => !disabled && setIsOpen(true)}
        label={label}
        disabled={disabled}
        fullWidth={fullWidth}
        placeholder={format === '12h' ? '12:00 PM' : '12:00'}
        leftIcon={<Clock className="w-5 h-5" />}
      />{' '}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-background border border-border rounded-lg shadow-standard-lg p-4"> {/* UI Revamp - Nouveau système d'ombres */}
          {' '}
          <div className="flex gap-4">
            {' '}
            {/* Hours */}{' '}
            <div className="flex flex-col">
              {' '}
              <div className="text-xs font-medium text-muted-foreground mb-2 text-center">
                {' '}
                Heures{' '}
              </div>{' '}
              <div className="max-h-48 overflow-y-auto">
                {' '}
                {generateHours().map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleTimeSelect(hour, currentTime.minutes)}
                    className={clsx(
                      'w-12 px-3 py-2 text-sm rounded hover:bg-muted',
                      currentTime.hours === hour &&
                        'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 font-medium'
                    )}
                  >
                    {' '}
                    {format === '12h'
                      ? hour === 12
                        ? 12
                        : hour
                      : String(hour).padStart(2, '0')}{' '}
                  </button>
                ))}{' '}
              </div>{' '}
            </div>{' '}
            {/* Minutes */}{' '}
            <div className="flex flex-col">
              {' '}
              <div className="text-xs font-medium text-muted-foreground mb-2 text-center">
                {' '}
                Minutes{' '}
              </div>{' '}
              <div className="max-h-48 overflow-y-auto">
                {' '}
                {generateMinutes()
                  .filter((min) => min % 5 === 0)
                  .map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleTimeSelect(currentTime.hours, minute)}
                      className={clsx(
                        'w-12 px-3 py-2 text-sm rounded hover:bg-muted',
                        currentTime.minutes === minute &&
                          'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 font-medium'
                      )}
                    >
                      {' '}
                      {String(minute).padStart(2, '0')}{' '}
                    </button>
                  ))}{' '}
              </div>{' '}
            </div>{' '}
            {/* Period (12h format only) */}{' '}
            {format === '12h' && (
              <div className="flex flex-col">
                {' '}
                <div className="text-xs font-medium text-muted-foreground mb-2 text-center">
                  {' '}
                  PÃ©riode{' '}
                </div>{' '}
                <div className="flex flex-col gap-1">
                  {' '}
                  <button
                    type="button"
                    onClick={() =>
                      handleTimeSelect(
                        currentTime.hours < 12 ? currentTime.hours : currentTime.hours - 12,
                        currentTime.minutes
                      )
                    }
                    className={clsx(
                      'px-3 py-2 text-sm rounded hover:bg-muted',
                      currentTime.hours < 12 &&
                        'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 font-medium'
                    )}
                  >
                    {' '}
                    AM{' '}
                  </button>{' '}
                  <button
                    type="button"
                    onClick={() =>
                      handleTimeSelect(
                        currentTime.hours >= 12 ? currentTime.hours : currentTime.hours + 12,
                        currentTime.minutes
                      )
                    }
                    className={clsx(
                      'px-3 py-2 text-sm rounded hover:bg-muted',
                      currentTime.hours >= 12 &&
                        'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 font-medium'
                    )}
                  >
                    {' '}
                    PM{' '}
                  </button>{' '}
                </div>{' '}
              </div>
            )}{' '}
          </div>{' '}
        </div>
      )}{' '}
    </div>
  );
}
