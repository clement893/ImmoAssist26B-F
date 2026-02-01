'use client';
import { InputHTMLAttributes, useCallback, useRef, useState } from 'react';
import { clsx } from 'clsx';
export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  label?: string;
  showValue?: boolean;
  marks?: { value: number; label: string }[];
  disabled?: boolean;
  fullWidth?: boolean;
}
export default function Slider({
  value: controlledValue,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  showValue = false,
  marks,
  disabled = false,
  fullWidth = false,
  className,
  ...props
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange]
  );
  return (
    <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      {' '}
      {label && (
        <div className="flex items-center justify-between">
          {' '}
          <label className="text-sm font-medium text-foreground">{label}</label>{' '}
          {showValue && <span className="text-sm text-muted-foreground">{currentValue}</span>}{' '}
        </div>
      )}{' '}
      <div className="relative">
        {' '}
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className={clsx(
            'w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer transition-modern', // UI Revamp - Transition moderne
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed',
            // Webkit thumb styles with improved transitions and shadows
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-subtle-sm [&::-webkit-slider-thumb]:transition-modern [&::-webkit-slider-thumb]:hover:bg-primary-700 [&::-webkit-slider-thumb]:hover:shadow-subtle-md [&::-webkit-slider-thumb]:active:scale-110',
            // Mozilla thumb styles with improved transitions and shadows
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-subtle-sm [&::-moz-range-thumb]:transition-modern [&::-moz-range-thumb]:hover:bg-primary-700 [&::-moz-range-thumb]:hover:shadow-subtle-md [&::-moz-range-thumb]:active:scale-110'
          )}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
          {...props}
        />{' '}
        {marks && marks.length > 0 && (
          <div className="flex justify-between mt-2">
            {' '}
            {marks.map((mark) => (
              <div
                key={mark.value}
                className="flex flex-col items-center"
                style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
              >
                {' '}
                <div className="w-1 h-1 bg-muted rounded-full mb-1" />{' '}
                <span className="text-xs text-muted-foreground">{mark.label}</span>{' '}
              </div>
            ))}{' '}
          </div>
        )}{' '}
      </div>{' '}
      {showValue && !label && (
        <div className="text-sm text-muted-foreground text-right">{currentValue}</div>
      )}{' '}
    </div>
  );
}
