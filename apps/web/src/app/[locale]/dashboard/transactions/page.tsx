'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Plus, Search, Filter } from 'lucide-react';

function TransactionsContent() {
  const [transactions, setTransactions] = useState<any[]>([]);

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions Immobilières</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos transactions immobilières et suivez leur progression
            </p>
          </div>
          <Button
            onClick={() => {
              // TODO: Ouvrir modal de création de transaction
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle transaction
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="flex items-center gap-4 p-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>
        </Card>

        {/* Transactions List */}
        <Card>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première transaction immobilière
              </p>
              <Button
                onClick={() => {
                  // TODO: Ouvrir modal de création
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une transaction
              </Button>
            </div>
          ) : (
            <div className="p-4">
              {/* TODO: Liste des transactions */}
              <p className="text-muted-foreground">Liste des transactions à venir...</p>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}

export default function TransactionsPage() {
  return <TransactionsContent />;
}
