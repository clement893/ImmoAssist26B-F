'use client';
import { InputHTMLAttributes, useCallback, useRef, useState } from 'react';
import { clsx } from 'clsx';
export interface RangeProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'defaultValue'
> {
  value?: [number, number];
  defaultValue?: [number, number];
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: [number, number]) => void;
  label?: string;
  showValues?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}
export default function Range({
  value: controlledValue,
  defaultValue = [0, 100],
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  showValues = false,
  disabled = false,
  fullWidth = false,
  className,
  ...props
}: RangeProps) {
  const [internalValue, setInternalValue] = useState<[number, number]>(defaultValue);
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const [minValue, maxValue] = currentValue;
  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Math.min(Number(e.target.value), maxValue);
      const newValue: [number, number] = [newMin, maxValue];
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, maxValue, onChange]
  );
  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Math.max(Number(e.target.value), minValue);
      const newValue: [number, number] = [minValue, newMax];
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, minValue, onChange]
  );
  const minPercentage = ((minValue - min) / (max - min)) * 100;
  const maxPercentage = ((maxValue - min) / (max - min)) * 100;
  return (
    <div className={clsx('flex flex-col gap-2', fullWidth && 'w-full', className)}>
      {' '}
      {label && (
        <div className="flex items-center justify-between">
          {' '}
          <label className="text-sm font-medium text-foreground">{label}</label>{' '}
          {showValues && (
            <span className="text-sm text-muted-foreground">
              {' '}
              {minValue} - {maxValue}{' '}
            </span>
          )}{' '}
        </div>
      )}{' '}
      <div className="relative">
        {' '}
        {/* Track */}{' '}
        <div className="h-2 bg-muted rounded-lg relative">
          {' '}
          {/* Active range */}{' '}
          <div
            className="absolute h-2 bg-primary-600 rounded-lg"
            style={{ left: `${minPercentage}%`, width: `${maxPercentage - minPercentage}%` }}
          />{' '}
        </div>{' '}
        {/* Min input */}{' '}
        <input
          ref={minInputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          disabled={disabled}
          className={clsx(
            'absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer z-10',
            'focus:outline-none',
            disabled && 'opacity-50 cursor-not-allowed',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-primary-700',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:hover:bg-primary-700'
          )}
          aria-label={`${label || 'Range'} minimum`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={minValue}
        />{' '}
        {/* Max input */}{' '}
        <input
          ref={maxInputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          disabled={disabled}
          className={clsx(
            'absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer z-10',
            'focus:outline-none',
            disabled && 'opacity-50 cursor-not-allowed',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-primary-700',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:hover:bg-primary-700'
          )}
          aria-label={`${label || 'Range'} maximum`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={maxValue}
          {...props}
        />{' '}
      </div>{' '}
      {showValues && !label && (
        <div className="flex justify-between text-sm text-muted-foreground">
          {' '}
          <span>{minValue}</span> <span>{maxValue}</span>{' '}
        </div>
      )}{' '}
    </div>
  );
}
