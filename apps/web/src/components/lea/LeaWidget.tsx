'use client';

import { useState } from 'react';
import LeaChat from './LeaChat';
import Button from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface LeaWidgetProps {
  className?: string;
}

export default function LeaWidget({ className = '' }: LeaWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={clsx('fixed bottom-4 right-4 z-50', className)}>
      {isOpen ? (
        <div className="w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <LeaChat onClose={() => setIsOpen(false)} />
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all"
          title="Ouvrir Léa - Assistante AI"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
