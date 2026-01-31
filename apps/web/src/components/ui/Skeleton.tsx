import { clsx } from 'clsx';
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}
export default function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-muted';
  const animations = { pulse: 'animate-pulse', wave: 'animate-pulse', none: '' };
  const variants = { text: 'rounded', circular: 'rounded-full', rectangular: 'rounded' };
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  return (
    <div
      className={clsx(baseStyles, variants[variant], animations[animation], className)}
      style={style}
    />
  );
}
