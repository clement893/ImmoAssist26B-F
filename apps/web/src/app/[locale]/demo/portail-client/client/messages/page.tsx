'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Paperclip,
  User,
  ArrowLeft,
  Phone,
  Mail,
  MoreVertical,
} from 'lucide-react';

interface Message {
  id: string;
  expediteur: 'client' | 'courtier';
  nom_expediteur: string;
  message: string;
  date: string;
  lu: boolean;
}

export default function MessagesPage() {
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [messages] = useState<Message[]>([
    {
      id: '1',
      expediteur: 'courtier',
      nom_expediteur: 'Marie Dubois',
      message: 'Bonjour Sophie! J\'espère que vous allez bien. Je voulais vous informer que j\'ai reçu la contre-offre du vendeur ce matin.',
      date: '2024-02-01T10:30:00',
      lu: true,
    },
    {
      id: '2',
      expediteur: 'client',
      nom_expediteur: 'Sophie Tremblay',
      message: 'Bonjour Marie! Merci pour l\'information. Pouvez-vous me donner plus de détails?',
      date: '2024-02-01T10:35:00',
      lu: true,
    },
    {
      id: '3',
      expediteur: 'courtier',
      nom_expediteur: 'Marie Dubois',
      message: 'Bien sûr! Le vendeur accepte votre offre de 450 000$, mais demande une date de prise de possession plus rapide, soit le 15 mars au lieu du 1er avril. Qu\'en pensez-vous?',
      date: '2024-02-01T10:40:00',
      lu: true,
    },
    {
      id: '4',
      expediteur: 'client',
      nom_expediteur: 'Sophie Tremblay',
      message: 'C\'est une bonne nouvelle! Je dois vérifier avec mon déménageur, mais je pense que c\'est faisable. Je vous confirme d\'ici ce soir.',
      date: '2024-02-01T11:15:00',
      lu: true,
    },
    {
      id: '5',
      expediteur: 'courtier',
      nom_expediteur: 'Marie Dubois',
      message: 'Parfait! Prenez votre temps. Je reste disponible si vous avez des questions.',
      date: '2024-02-01T11:20:00',
      lu: true,
    },
    {
      id: '6',
      expediteur: 'courtier',
      nom_expediteur: 'Marie Dubois',
      message: 'Au fait, j\'ai aussi envoyé les documents pour l\'inspection prévue lundi prochain. Vous les trouverez dans la section Documents.',
      date: '2024-02-01T15:45:00',
      lu: false,
    },
    {
      id: '7',
      expediteur: 'courtier',
      nom_expediteur: 'Marie Dubois',
      message: 'N\'oubliez pas de préparer vos questions pour l\'inspecteur!',
      date: '2024-02-01T15:46:00',
      lu: false,
    },
  ]);

  const courtier = {
    nom: 'Marie Dubois',
    titre: 'Courtier immobilier',
    email: 'marie.dubois@immoassist.com',
    telephone: '514-555-0100',
  };

  const handleEnvoyerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (nouveauMessage.trim()) {
      console.log('Envoi du message:', nouveauMessage);
      setNouveauMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <Link
            href="/fr/demo/portail-client/client"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Messagerie</h1>
                <p className="text-sm text-gray-500 font-light">
                  Conversation avec {courtier.nom}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`tel:${courtier.telephone}`}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                title="Appeler"
              >
                <Phone className="w-5 h-5 text-gray-600" />
              </a>
              <a
                href={`mailto:${courtier.email}`}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                title="Envoyer un email"
              >
                <Mail className="w-5 h-5 text-gray-600" />
              </a>
              <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-8 py-8 flex flex-col">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => {
              const isCourtier = msg.expediteur === 'courtier';
              const showAvatar =
                index === 0 || messages[index - 1].expediteur !== msg.expediteur;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isCourtier ? 'justify-start' : 'justify-end'}`}
                >
                  {isCourtier && showAvatar && (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  {isCourtier && !showAvatar && <div className="w-10" />}

                  <div
                    className={`max-w-[70%] ${
                      isCourtier ? 'items-start' : 'items-end'
                    } flex flex-col gap-1`}
                  >
                    {showAvatar && (
                      <p className="text-xs font-medium text-gray-700 px-4">
                        {msg.nom_expediteur}
                      </p>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        isCourtier
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className="text-xs text-gray-400 px-4">
                      {new Date(msg.date).toLocaleString('fr-CA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {!isCourtier && showAvatar && (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {!isCourtier && !showAvatar && <div className="w-10" />}
                </div>
              );
            })}
          </div>

          {/* Zone de saisie */}
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={handleEnvoyerMessage} className="flex gap-3">
              <button
                type="button"
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
              >
                <Paperclip className="w-5 h-5 text-gray-600" />
              </button>

              <input
                type="text"
                value={nouveauMessage}
                onChange={(e) => setNouveauMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
              />

              <button
                type="submit"
                disabled={!nouveauMessage.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium">Envoyer</span>
              </button>
            </form>

            <p className="text-xs text-gray-400 mt-3 text-center">
              Votre courtier répond généralement en moins de 2 heures pendant les heures
              ouvrables
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
