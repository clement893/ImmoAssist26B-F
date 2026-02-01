'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  UserPlus,
  LayoutDashboard,
  FileText,
  MessageSquare,
  CheckSquare,
  Mail,
  Key,
  ExternalLink,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';

export default function AdminPortailClientsInfoPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const basePath = `/${locale}/dashboard`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portail clients – Documentation</h1>
            <p className="text-gray-500 font-light">Fonctionnement, liens et informations de la fonctionnalité</p>
          </div>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Vue d&apos;ensemble
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-700 leading-relaxed mb-4">
            Le <strong>Portail client ImmoAssist</strong> permet aux courtiers d&apos;inviter leurs clients par email
            et de leur donner accès à un espace dédié pour suivre une transaction (achat, vente ou location).
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Le <strong>courtier</strong> invite un client (email, prénom, nom, type de projet, permissions).</li>
            <li>Un <strong>email d&apos;invitation</strong> est envoyé via SendGrid avec un lien d&apos;activation.</li>
            <li>Le <strong>client</strong> clique sur le lien, définit son mot de passe et active son compte.</li>
            <li>Le client accède à son <strong>portail</strong> : dashboard, documents, messagerie, tâches.</li>
          </ul>
          <p className="text-gray-600 text-sm">
            Données stockées en base (modèles Portail client) : invitations, transactions, documents partagés,
            messages, tâches, étapes.
          </p>
        </div>
      </section>

      {/* Côté courtier */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Côté courtier
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-700 mb-4">
            Depuis le menu du dashboard, section <strong>Portail client</strong>, le courtier accède à :
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Liste des clients</strong> – Voir tous les clients invités, filtrer par statut (invité, actif, inactif)
                et par type de projet (achat, vente, location). Recherche par nom/email.
                <br />
                <Link
                  href={`${basePath}/portail-client/courtier/clients`}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {basePath}/portail-client/courtier/clients
                </Link>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Inviter un client</strong> – Formulaire : prénom, nom, email, téléphone, type de projet,
                permissions (documents, messagerie, tâches, calendrier, propriétés), message personnalisé.
                Envoi de l&apos;invitation et de l&apos;email (SendGrid).
                <br />
                <Link
                  href={`${basePath}/portail-client/courtier/clients/inviter`}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {basePath}/portail-client/courtier/clients/inviter
                </Link>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Côté client */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-600" />
          Côté client (portail)
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-700 mb-4">
            Une fois le compte activé, le client a un <strong>menu latéral dédié</strong> (Mon portail) avec
            uniquement ses pages. Pas d&apos;accès au menu courtier.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>Dashboard</strong> – Message de bienvenue, progression de la transaction, propriété actuelle,
                liens vers documents, messagerie, tâches.
                <br />
                <span className="text-gray-500 text-sm">{basePath}/portail-client/client</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>Documents</strong> – Liste des documents partagés par le courtier, filtres par catégorie,
                recherche.
                <br />
                <span className="text-gray-500 text-sm">{basePath}/portail-client/client/documents</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>Messagerie</strong> – Échange avec le courtier (messages en temps réel via l&apos;API).
                <br />
                <span className="text-gray-500 text-sm">{basePath}/portail-client/client/messages</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>Tâches</strong> – Liste des tâches (priorité, échéance, catégorie), marquer comme complétée.
                <br />
                <span className="text-gray-500 text-sm">{basePath}/portail-client/client/taches</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Flux d'activation */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          Flux d&apos;activation du compte client
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Le courtier crée une invitation (formulaire « Inviter un client »).</li>
            <li>Un token unique est généré et un email est envoyé (SendGrid) avec le lien :<br />
              <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                {`{FRONTEND_URL}/{locale}/portail-client/activation/{token}`}
              </code>
              <br />
              <span className="text-sm text-gray-500">(locale par défaut : FRONTEND_DEFAULT_LOCALE ou &quot;fr&quot;)</span>
            </li>
            <li>Le client ouvre le lien : page <strong>Activation</strong> (<code>/{'{locale}'}/portail-client/activation/[token]</code>) qui valide le token via <code>GET /api/v1/client-invitations/by-token/{'{token}'}</code> puis affiche le formulaire mot de passe.</li>
            <li>Le client saisit son mot de passe et soumet : <code>POST /api/v1/client-invitations/activate/{'{token}'}</code> avec <code>{`{ "password": "...", "first_name": "...", "last_name": "..." }`}</code> (first_name/last_name optionnels).</li>
            <li>Le backend crée l&apos;utilisateur (client), lie <code>client_invitation_id</code>, crée une transaction par défaut, marque l&apos;invitation comme « actif ».</li>
            <li>Le client est redirigé vers la connexion et peut accéder à son portail après login.</li>
          </ol>
          <p className="text-green-700 text-sm mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            La page frontend <strong>Activation</strong> est implémentée : <code>/{'{locale}'}/portail-client/activation/[token]</code>. Endpoints publics : <code>GET /api/v1/client-invitations/by-token/{'{token}'}</code> (infos invitation), <code>POST /api/v1/client-invitations/activate/{'{token}'}</code> (création compte).
          </p>
        </div>
      </section>

      {/* Emails (SendGrid) */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Envoi des emails (SendGrid)
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-700 mb-4">
            L&apos;email d&apos;invitation est envoyé automatiquement lors de la création d&apos;une invitation,
            <strong> si SendGrid est configuré</strong>. Sinon, l&apos;invitation est tout de même créée en base
            (aucune erreur renvoyée à l&apos;utilisateur).
          </p>
          <p className="text-gray-700 mb-2">Variables d&apos;environnement requises (ex. Railway) :</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
            <li><strong>SENDGRID_API_KEY</strong> – Clé API SendGrid (obligatoire pour envoyer).</li>
            <li><strong>SENDGRID_FROM_EMAIL</strong> – Adresse expéditrice (ex. noreply@votredomaine.com).</li>
            <li><strong>SENDGRID_FROM_NAME</strong> – Nom affiché (ex. ImmoAssist).</li>
            <li><strong>FRONTEND_URL</strong> – URL du frontend pour le lien d&apos;activation (ex. https://votre-app.up.railway.app).</li>
            <li><strong>FRONTEND_DEFAULT_LOCALE</strong> – Locale pour le lien d&apos;activation (défaut : <code>fr</code>).</li>
          </ul>
          <p className="text-gray-600 text-sm">
            Template utilisé : <code>EmailTemplates.invitation_portail</code> (service <code>email_templates.py</code>).
            Méthode d&apos;envoi : <code>EmailService.send_invitation_portail_email</code> (service <code>email_service.py</code>).
          </p>
        </div>
      </section>

      {/* API Backend */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          API Backend (résumé)
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-700 mb-4">Tous les endpoints sont sous <code>/api/v1</code> et nécessitent une authentification Bearer (sauf activation).</p>
          <ul className="space-y-2 text-sm text-gray-700 font-mono">
            <li><strong>POST</strong> /client-invitations – Créer une invitation (courtier)</li>
            <li><strong>GET</strong> /client-invitations – Liste des invitations (courtier)</li>
            <li><strong>GET</strong> /client-invitations/{'{id}'} – Détail invitation</li>
            <li><strong>PUT</strong> /client-invitations/{'{id}'} – Modifier invitation</li>
            <li><strong>POST</strong> /client-invitations/activate/{'{token}'} – Activer compte client (public, body: password, etc.)</li>
            <li><strong>GET</strong> /portail/transactions/client – Transaction active du client</li>
            <li><strong>GET</strong> /portail/transactions/courtier – Liste des transactions (courtier)</li>
            <li><strong>GET/POST</strong> /portail/transaction-documents/... – Documents</li>
            <li><strong>GET/POST</strong> /portail/transaction-messages/... – Messages</li>
            <li><strong>GET/POST/PUT</strong> /portail/transaction-taches/... – Tâches (dont toggle complétée)</li>
          </ul>
        </div>
      </section>

      {/* Sécurité et accès */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Sécurité et accès
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Les pages du portail (courtier et client) sont sous le dashboard déjà protégé par authentification.</li>
            <li>Le backend vérifie que le courtier ne voit que ses invitations/transactions, et que le client ne voit que sa transaction (via <code>client_invitation_id</code>).</li>
            <li>L&apos;activation par token est la seule opération « publique » (sans Bearer) ; le token doit rester confidentiel.</li>
          </ul>
        </div>
      </section>

      {/* Liens rapides */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Liens rapides</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`${basePath}/portail-client/courtier/clients`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            <Users className="w-4 h-4" />
            Liste des clients
          </Link>
          <Link
            href={`${basePath}/portail-client/courtier/clients/inviter`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Inviter un client
          </Link>
          <Link
            href={`${basePath}/portail-client/client`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200"
          >
            <LayoutDashboard className="w-4 h-4" />
            Portail client (dashboard)
          </Link>
          <Link
            href={`/${locale}/dashboard/modules/admin`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200"
          >
            Retour Admin
          </Link>
        </div>
      </section>
    </div>
  );
}
