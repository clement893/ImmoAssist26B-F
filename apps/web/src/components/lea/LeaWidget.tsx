'use client';

import { useState } from 'react';
import LeaChat from './LeaChat';
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
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white"
          title="Ouvrir Léa - Assistante AI"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
