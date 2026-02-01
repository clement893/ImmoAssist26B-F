'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import TransactionStepsV2 from '@/components/transactions/TransactionStepsV2';
import { transactionsAPI } from '@/lib/api';
import { Search } from 'lucide-react';

interface TransactionSummary {
  id: number;
  name: string;
  dossier_number?: string;
}

export default function TransactionStepsPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'fr';
  const transactionFromUrl = useMemo(
    () => searchParams.get('transaction'),
    [searchParams]
  );
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(transactionFromUrl ? parseInt(transactionFromUrl, 10) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to transaction detail page with steps tab when ?transaction=id is present
  useEffect(() => {
    if (transactionFromUrl) {
      const id = parseInt(transactionFromUrl, 10);
      if (!isNaN(id)) {
        router.replace(`/${locale}/dashboard/transactions/${id}?tab=steps`);
      }
    }
  }, [transactionFromUrl, locale, router]);

  useEffect(() => {
    if (transactionFromUrl) {
      const id = parseInt(transactionFromUrl, 10);
      if (!isNaN(id)) setSelectedTransactionId(id);
    }
  }, [transactionFromUrl]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionsAPI.list({
        search: searchQuery || undefined,
      });
      const list = response.data?.transactions || [];
      setTransactions(list);
      if (list.length > 0) {
        const idInList = list.some((t: TransactionSummary) => t.id === selectedTransactionId);
        if (!selectedTransactionId || !idInList) {
          setSelectedTransactionId(list[0].id);
        }
      } else if (selectedTransactionId) {
        setSelectedTransactionId(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [searchQuery]);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Étapes des Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Suivez la progression de vos transactions immobilières étape par
            étape, guidé par Léa
          </p>
        </div>

        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        <Card>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <Select
                options={transactions.map((t) => ({
                  label: `${t.name}${t.dossier_number ? ` (${t.dossier_number})` : ''}`,
                  value: t.id.toString(),
                }))}
                value={selectedTransactionId?.toString() || ''}
                onChange={(e) =>
                  setSelectedTransactionId(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Sélectionner une transaction"
                className="min-w-[300px]"
              />
            </div>
          </div>
        </Card>

        {loading && transactions.length === 0 ? (
          <Card>
            <div className="p-12 text-center text-muted-foreground">
              Chargement des transactions...
            </div>
          </Card>
        ) : (
          <TransactionStepsV2
            transactionId={selectedTransactionId}
            onError={setError}
          />
        )}
      </div>
    </Container>
  );
}
