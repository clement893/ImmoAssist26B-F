'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { BookOpen, Search, Star } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  is_featured: boolean;
  view_count: number;
  created_at: string;
}
interface Category {
  id: number;
  slug: string;
  name: string;
  description?: string;
}
interface ArticleListProps {
  className?: string;
}
export function ArticleList({ className = '' }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, [selectedCategory, searchQuery]);
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<Category[]>(
        '/api/v1/documentation/documentation/categories'
      );
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch categories:', error);
    }
  };
  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Article[]>(
        '/api/v1/documentation/documentation/articles',
        { params: { category_id: selectedCategory || undefined, search: searchQuery || undefined } }
      );
      if (response.data) {
        setArticles(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch articles:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const featuredArticles = articles.filter((a) => a.is_featured);
  const regularArticles = articles.filter((a) => !a.is_featured);
  return (
    <div className={className}>
      {' '}
      <div className="mb-6">
        {' '}
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          {' '}
          <BookOpen className="h-6 w-6" /> Documentation{' '}
        </h2>{' '}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {' '}
          <div className="flex-1">
            {' '}
            <div className="relative">
              {' '}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />{' '}
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />{' '}
            </div>{' '}
          </div>{' '}
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          >
            {' '}
            <option value="">All Categories</option>{' '}
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {' '}
                {cat.name}{' '}
              </option>
            ))}{' '}
          </select>{' '}
        </div>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading articles...</div>
      ) : articles.length === 0 ? (
        <Card>
          {' '}
          <div className="text-center py-8 text-muted-foreground">
            {' '}
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />{' '}
            <p>No articles found</p>{' '}
          </div>{' '}
        </Card>
      ) : (
        <div className="space-y-6">
          {' '}
          {featuredArticles.length > 0 && (
            <div>
              {' '}
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {' '}
                <Star className="h-5 w-5 text-warning-500" /> Featured Articles{' '}
              </h3>{' '}
              <div className="grid md:grid-cols-2 gap-4">
                {' '}
                {featuredArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow">
                    {' '}
                    <Link href={`/docs/${article.slug}`}>
                      {' '}
                      <h4 className="font-semibold mb-2">{article.title}</h4>{' '}
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground mb-2"> {article.excerpt} </p>
                      )}{' '}
                      <div className="text-xs text-muted-foreground">
                        {' '}
                        {article.view_count} views{' '}
                      </div>{' '}
                    </Link>{' '}
                  </Card>
                ))}{' '}
              </div>{' '}
            </div>
          )}{' '}
          {regularArticles.length > 0 && (
            <div>
              {' '}
              <h3 className="text-lg font-semibold mb-3">All Articles</h3>{' '}
              <div className="space-y-2">
                {' '}
                {regularArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    {' '}
                    <Link href={`/docs/${article.slug}`}>
                      {' '}
                      <div className="flex items-center justify-between">
                        {' '}
                        <div>
                          {' '}
                          <h4 className="font-semibold">{article.title}</h4>{' '}
                          {article.excerpt && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {' '}
                              {article.excerpt}{' '}
                            </p>
                          )}{' '}
                        </div>{' '}
                        <div className="text-xs text-muted-foreground ml-4">
                          {' '}
                          {article.view_count} views{' '}
                        </div>{' '}
                      </div>{' '}
                    </Link>{' '}
                  </Card>
                ))}{' '}
              </div>{' '}
            </div>
          )}{' '}
        </div>
      )}{' '}
    </div>
  );
}
