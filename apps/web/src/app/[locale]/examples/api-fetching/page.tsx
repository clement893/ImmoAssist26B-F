'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { useToast } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useRetry } from '@/hooks/useRetry';
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export default function ExampleAPIFetchingPage() {
  const { showToast } = useToast();
  const [optimisticData, setOptimisticData] = useState<Post[]>([]);
  const [isOptimisticUpdating, setIsOptimisticUpdating] = useState(false);

  // Example 1: useApi hook with retry
  const {
    data: posts,
    isLoading,
    error,
    refetch,
  } = useApi<Post[]>({
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'GET',
    retry: {
      attempts: 3,
      delay: 1000,
    },
    onSuccess: (data) => {
      showToast({
        message: `${data.length} posts chargés avec succès`,
        type: 'success',
      });
    },
    onError: (err) => {
      showToast({
        message: `Erreur: ${err.message}`,
        type: 'error',
      });
    },
  });

  // Example 2: useRetry hook
  const {
    execute: retryFetch,
    attempt,
    isRetrying,
    lastError,
  } = useRetry({
    maxAttempts: 3,
    delay: 2000,
    exponentialBackoff: true,
  });

  const handleRetryFetch = async () => {
    try {
      await retryFetch(async () => {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        if (!response.ok) throw new Error('Network error');
        return response.json();
      });
      showToast({
        message: `Données chargées après ${attempt} tentative(s)`,
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: `Échec après ${attempt} tentatives`,
        type: 'error',
      });
    }
  };

  // Example 3: Optimistic Updates
  const handleOptimisticUpdate = async (postId: number, newTitle: string) => {
    setIsOptimisticUpdating(true);

    // Optimistic update - update UI immediately
    setOptimisticData((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, title: newTitle } : post))
    );

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // If successful, keep the optimistic update
      showToast({
        message: 'Post mis à jour avec succès',
        type: 'success',
      });
    } catch (error) {
      // Rollback on error
      setOptimisticData((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, title: `Post ${postId}` } : post))
      );
      showToast({
        message: 'Erreur lors de la mise à jour',
        type: 'error',
      });
    } finally {
      setIsOptimisticUpdating(false);
    }
  };

  // Example 4: Cache and Refetch
  const [cacheKey, setCacheKey] = useState(0);
  const {
    data: cachedData,
    isLoading: isCachedLoading,
    refetch: refetchCache,
  } = useApi<Post[]>({
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'GET',
    immediate: false,
  });

  useEffect(() => {
    if (cacheKey > 0) {
      refetchCache();
    }
  }, [cacheKey, refetchCache]);

  const handleInvalidateCache = () => {
    setCacheKey((prev) => prev + 1);
    showToast({
      message: 'Cache invalidé, rechargement...',
      type: 'info',
    });
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple API / Data Fetching</h1>
        <p className="text-muted-foreground">
          Exemples de récupération de données avec retry, cache et optimistic updates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Example 1: useApi with retry */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">1. useApi avec Retry</h2>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 text-error-600 dark:text-error-400">
                  <XCircle className="w-4 h-4" />
                  Erreur: {error.message}
                </div>
              ) : posts ? (
                <div>
                  <div className="flex items-center gap-2 text-success-600 dark:text-success-400 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    {posts.length} posts chargés
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {posts.slice(0, 3).map((post) => (
                      <div key={post.id} className="mb-2">
                        <strong>{post.title}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recharger
              </Button>
            </div>
          </div>
        </Card>

        {/* Example 2: useRetry hook */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">2. useRetry Hook</h2>
            <div className="space-y-4">
              {isRetrying && (
                <div className="text-sm text-warning-600 dark:text-warning-400">
                  Tentative {attempt} en cours...
                </div>
              )}
              {lastError && (
                <div className="text-sm text-error-600 dark:text-error-400">
                  Erreur: {lastError.message}
                </div>
              )}
              <Button onClick={handleRetryFetch} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tester Retry
              </Button>
              <p className="text-xs text-muted-foreground">Tentative: {attempt} / 3</p>
            </div>
          </div>
        </Card>

        {/* Example 3: Optimistic Updates */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">3. Optimistic Updates</h2>
            <div className="space-y-4">
              {optimisticData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée optimiste</p>
              ) : (
                <div className="space-y-2">
                  {optimisticData.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center justify-between">
                      <span className="text-sm">{post.title}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOptimisticUpdate(post.id, 'Nouveau titre')}
                        disabled={isOptimisticUpdating}
                      >
                        Mettre à jour
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => {
                  setOptimisticData(
                    posts?.slice(0, 3) || [
                      { id: 1, title: 'Post 1', body: '', userId: 1 },
                      { id: 2, title: 'Post 2', body: '', userId: 1 },
                      { id: 3, title: 'Post 3', body: '', userId: 1 },
                    ]
                  );
                }}
                variant="outline"
                size="sm"
              >
                Charger des données
              </Button>
            </div>
          </div>
        </Card>

        {/* Example 4: Cache and Refetch */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">4. Cache et Refetch</h2>
            <div className="space-y-4">
              {isCachedLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </div>
              ) : cachedData ? (
                <div className="text-sm text-muted-foreground">
                  {cachedData.length} posts en cache
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cache vide</p>
              )}
              <Button onClick={handleInvalidateCache} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Invalider le cache
              </Button>
              <p className="text-xs text-muted-foreground">Clé de cache: {cacheKey}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Code Example */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Points clés de cet exemple :
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ useApi hook avec retry automatique</li>
            <li>✅ useRetry hook pour retry personnalisé</li>
            <li>✅ Optimistic updates pour UX améliorée</li>
            <li>✅ Gestion du cache et invalidation</li>
            <li>✅ Gestion des erreurs avec retry</li>
            <li>✅ États de chargement et feedback</li>
          </ul>
        </div>
      </Card>
    </Container>
  );
}
