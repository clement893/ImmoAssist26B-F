'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Eye, BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { SafeHTML } from '@/components/ui/SafeHTML';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage, getErrorStatus } from '@/lib/errors';

interface Article {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  category_id?: number;
  tags?: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
}

interface ArticleViewerProps {
  slug: string;
  className?: string;
}

export function ArticleViewer({ slug, className = '' }: ArticleViewerProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Article>(`/v1/documentation/articles/${slug}`);
      if (response.data) {
        setArticle(response.data);
      }
    } catch (error: unknown) {
      const statusCode = getErrorStatus(error);
      if (statusCode === 404) {
        showToast({ message: 'Article not found', type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (isHelpful: boolean) => {
    if (!article || feedbackSubmitted) return;

    try {
      await apiClient.post(`/v1/documentation/articles/${article.id}/feedback`, {
        is_helpful: isHelpful,
      });
      setFeedbackSubmitted(true);
      showToast({ message: 'Thank you for your feedback!', type: 'success' });
      // Refresh article to get updated counts
      fetchArticle();
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to submit feedback', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-muted-foreground">Loading article...</div>
      </Card>
    );
  }

  if (!article) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Article not found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <article>
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          {article.excerpt && <p className="text-lg text-muted-foreground mb-4">{article.excerpt}</p>}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.view_count} views
            </span>
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
          </div>
        </header>

        <SafeHTML html={article.content} className="prose dark:prose-invert max-w-none mb-8" />

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-muted rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold mb-3">Was this article helpful?</h3>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(true)}
              disabled={feedbackSubmitted}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Yes ({article.helpful_count})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(false)}
              disabled={feedbackSubmitted}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              No ({article.not_helpful_count})
            </Button>
          </div>
        </div>
      </article>
    </Card>
  );
}
