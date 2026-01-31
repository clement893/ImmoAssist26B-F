/** * Image Editor Component * Basic image editing tool */ 'use client';
import { useState, useRef } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Upload, Download, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
export interface ImageEditorProps {
  imageUrl?: string;
  onSave?: (imageData: string) => Promise<void>;
  className?: string;
}
export default function ImageEditor({ imageUrl, onSave, className }: ImageEditorProps) {
  const [image, setImage] = useState<string | null>(imageUrl || null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  const handleSave = async () => {
    if (image && onSave) {
      await onSave(image);
    }
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-4">
        {' '}
        {/* Toolbar */}{' '}
        <div className="flex items-center justify-between">
          {' '}
          <div className="flex items-center gap-2">
            {' '}
            <h3 className="text-lg font-semibold text-foreground"> Image Editor </h3>{' '}
          </div>{' '}
          <div className="flex items-center gap-2">
            {' '}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />{' '}
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                <Upload className="w-4 h-4" /> Upload{' '}
              </span>{' '}
            </Button>{' '}
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              {' '}
              <ZoomOut className="w-4 h-4" />{' '}
            </Button>{' '}
            <span className="text-sm text-muted-foreground min-w-[50px] text-center">
              {' '}
              {zoom}%{' '}
            </span>{' '}
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              {' '}
              <ZoomIn className="w-4 h-4" />{' '}
            </Button>{' '}
            <Button variant="outline" size="sm" onClick={handleRotate}>
              {' '}
              <RotateCw className="w-4 h-4" />{' '}
            </Button>{' '}
            {image && (
              <Button variant="primary" size="sm" onClick={handleSave}>
                {' '}
                <span className="flex items-center gap-2">
                  {' '}
                  <Download className="w-4 h-4" /> Save{' '}
                </span>{' '}
              </Button>
            )}{' '}
          </div>{' '}
        </div>{' '}
        {/* Image Canvas */}{' '}
        {image ? (
          <div className="border border-border rounded-lg p-4 bg-muted overflow-auto">
            {' '}
            <div className="flex items-center justify-center min-h-[400px]">
              {' '}
              <img
                src={image}
                alt="Edited"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                  maxWidth: '100%',
                  maxHeight: '600px',
                }}
                className="rounded-lg"
              />{' '}
            </div>{' '}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            {' '}
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />{' '}
            <p className="text-muted-foreground mb-4"> Upload an image to start editing </p>{' '}
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                <Upload className="w-4 h-4" /> Choose Image{' '}
              </span>{' '}
            </Button>{' '}
          </div>
        )}{' '}
        {/* Info */}{' '}
        {image && (
          <div className="text-xs text-muted-foreground text-center">
            {' '}
            Use the toolbar to zoom, rotate, and edit your image{' '}
          </div>
        )}{' '}
      </div>{' '}
    </Card>
  );
}
