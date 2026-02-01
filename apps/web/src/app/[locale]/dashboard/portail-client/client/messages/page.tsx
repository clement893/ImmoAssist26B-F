'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MessageSquare, Send, ArrowLeft, User } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Message {
  id: number;
  transaction_id: number;
  expediteur_id: number;
  message: string;
  date_envoi: string;
  lu: boolean;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const txRes = await apiClient.get<{ id: number }>('v1/portail/transactions/client');
        setTransactionId(txRes.data.id);
        const msgRes = await apiClient.get<Message[]>(`v1/portail/transaction-messages/transaction/${txRes.data.id}`);
        setMessages(Array.isArray(msgRes.data) ? msgRes.data : []);
      } catch {
        setTransactionId(null);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEnvoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauMessage.trim() || !transactionId || sending) return;
    setSending(true);
    try {
      await apiClient.post('v1/portail/transaction-messages', {
        transaction_id: transactionId,
        message: nouveauMessage.trim(),
      });
      setNouveauMessage('');
      const msgRes = await apiClient.get<Message[]>(`v1/portail/transaction-messages/transaction/${transactionId}`);
      setMessages(Array.isArray(msgRes.data) ? msgRes.data : []);
    } finally {
      setSending(false);
    }
  };

  const isFromMe = (expediteurId: number) => user?.id === expediteurId;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!transactionId) {
    return (
      <div className="max-w-[900px] mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune transaction active</h2>
          <p className="text-gray-500">La messagerie sera disponible lorsqu'une transaction sera associée à votre compte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-8 py-8 flex flex-col h-[calc(100vh-8rem)]">
      <Link
        href="/dashboard/portail-client/client"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au dashboard
      </Link>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-full">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Messagerie</h1>
            <p className="text-xs text-gray-500">Échangez avec votre courtier</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${isFromMe(msg.expediteur_id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  isFromMe(msg.expediteur_id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-xs mt-1 ${isFromMe(msg.expediteur_id) ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(msg.date_envoi).toLocaleString('fr-CA')}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleEnvoyer} className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={nouveauMessage}
              onChange={(e) => setNouveauMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !nouveauMessage.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
