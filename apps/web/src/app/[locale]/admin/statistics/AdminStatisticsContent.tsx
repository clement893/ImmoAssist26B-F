'use client';

import { useEffect, useState } from 'react';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { apiClient } from '@/lib/api';
import { rbacAPI } from '@/lib/api/rbac';
import { getErrorMessage } from '@/lib/errors';
import { extractApiData } from '@/lib/api/utils';
import { logger } from '@/lib/logger';
import { Card, Badge, Alert, Loading } from '@/components/ui';
import type { User, AuditLog, Team, Post, Page, Project } from '@/lib/types/common';

interface Statistics {
  total_users: number;
  active_users: number;
  total_organizations: number;
  total_logs: number;
  recent_activities: number;
}

interface DetailedMetrics {
  rbac: {
    total_roles: number;
    total_permissions: number;
    roles_distribution: Array<{ role: string; count: number }>;
    permissions_by_resource: Record<string, number>;
  };
  users: {
    new_users_last_7_days: number;
    new_users_last_30_days: number;
    users_by_status: { active: number; inactive: number };
  };
  activity: {
    activities_by_type: Record<string, number>;
    activities_by_day: Array<{ date: string; count: number }>;
  };
  system: {
    logs_by_level: Record<string, number>;
    recent_errors: number;
  };
  organizations: {
    total: number;
    active: number;
    new_last_7_days: number;
    new_last_30_days: number;
  };
  subscriptions: {
    total: number;
    active: number;
    by_status: Record<string, number>;
    new_last_7_days: number;
    new_last_30_days: number;
  };
  content: {
    total_posts: number;
    published_posts: number;
    total_pages: number;
    published_pages: number;
  };
  projects: {
    total: number;
    by_status: Record<string, number>;
  };
}

export default function AdminStatisticsContent() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [detailedMetrics, setDetailedMetrics] = useState<DetailedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
    loadDetailedMetrics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load users
      const usersResponse = await apiClient.get('/v1/users?page=1&page_size=1');
      interface PaginatedResponse<T> {
        data?: T | { data?: T; total?: number };
        total?: number;
      }

      interface AuditLog {
        timestamp: string;
        [key: string]: unknown;
      }

      const usersResponseData = (usersResponse as PaginatedResponse<{ total?: number }>).data;
      const usersData =
        usersResponseData && typeof usersResponseData === 'object' && 'total' in usersResponseData
          ? usersResponseData
          : usersResponse.data &&
              typeof usersResponse.data === 'object' &&
              'total' in usersResponse.data
            ? usersResponse.data
            : null;
      const responseTotal = (usersResponse as PaginatedResponse<unknown>).total;
      const totalUsers: number =
        usersData && typeof usersData === 'object' && 'total' in usersData
          ? typeof usersData.total === 'number'
            ? usersData.total
            : 0
          : typeof responseTotal === 'number'
            ? responseTotal
            : 0;

      // Load audit trail stats
      let totalLogs = 0;
      let recentActivities = 0;
      try {
        const logsResponse = await apiClient.get('/v1/audit-trail/audit-trail?limit=1&offset=0');
        const logsResponseData = (logsResponse as PaginatedResponse<AuditLog[]>).data;
        const logsData =
          logsResponseData && typeof logsResponseData === 'object' && 'data' in logsResponseData
            ? (logsResponseData as { data?: AuditLog[] }).data
            : Array.isArray(logsResponseData)
              ? logsResponseData
              : logsResponse.data;
        if (Array.isArray(logsData)) {
          totalLogs = logsData.length;
          recentActivities = logsData.filter((log) => {
            if (!log.timestamp || typeof log.timestamp !== 'string') return false;
            const logDate = new Date(log.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return logDate >= weekAgo;
          }).length;
        }
      } catch (e) {
        // Ignore if audit trail is not available
      }

      // Load teams/organizations
      let totalOrgs = 0;
      try {
        const { teamsAPI } = await import('@/lib/api');
        const teamsResponse = await teamsAPI.list();
        if (teamsResponse.data) {
          // Backend returns { teams: [...], total: ... }
          const teamsData = teamsResponse.data.teams || teamsResponse.data;
          totalOrgs = Array.isArray(teamsData) ? teamsData.length : teamsResponse.data.total || 0;
        }
      } catch (e) {
        // Log 422 validation errors but don't block the page
        const errorMessage = getErrorMessage(e);
        if (
          errorMessage?.includes('422') ||
          errorMessage?.includes('settings') ||
          errorMessage?.includes('dictionary')
        ) {
          logger.warn(
            'Teams API validation error in statistics',
            e instanceof Error ? e : new Error(String(e))
          );
        }
        // Ignore other errors if teams API is not available
      }

      setStats({
        total_users: totalUsers,
        active_users: totalUsers, // Note: Active users calculation can be added if needed (users who logged in within last 30 days)
        total_organizations: totalOrgs,
        total_logs: totalLogs,
        recent_activities: recentActivities,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des statistiques'));
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedMetrics = async () => {
    try {
      setLoadingMetrics(true);

      // Load RBAC metrics
      const [rolesResponse, permissionsResponse] = await Promise.all([
        rbacAPI.listRoles(0, 1000).catch(() => ({ roles: [], total: 0 })),
        rbacAPI.listPermissions().catch(() => []),
      ]);

      const roles = rolesResponse.roles || [];
      const permissions = permissionsResponse || [];

      // Calculate roles distribution (users per role)
      const rolesDistribution: Array<{ role: string; count: number }> = [];
      for (const role of roles) {
        try {
          // Try to get users with this role (approximation)
          // Note: This is a simplified approach - ideally we'd have a dedicated endpoint
          rolesDistribution.push({
            role: role.name,
            count: role.permissions?.length || 0, // Using permissions count as proxy
          });
        } catch (e) {
          rolesDistribution.push({ role: role.name, count: 0 });
        }
      }

      // Group permissions by resource
      const permissionsByResource: Record<string, number> = {};
      permissions.forEach((perm) => {
        const resource = perm.resource || 'other';
        permissionsByResource[resource] = (permissionsByResource[resource] || 0) + 1;
      });

      // Load user metrics
      let newUsersLast7Days = 0;
      let newUsersLast30Days = 0;
      let activeUsers = 0;
      let inactiveUsers = 0;

      try {
        const usersResponse = await apiClient.get('/v1/users?page=1&page_size=1000');
        const usersData = extractApiData<unknown[] | { data: unknown[] }>(usersResponse);
        const users = (
          Array.isArray(usersData)
            ? usersData
            : usersData &&
                typeof usersData === 'object' &&
                'data' in usersData &&
                Array.isArray(usersData.data)
              ? usersData.data
              : []
        ) as User[];

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        users.forEach((user) => {
          const createdAt = user.created_at ? new Date(user.created_at) : null;
          if (createdAt) {
            if (createdAt >= sevenDaysAgo) newUsersLast7Days++;
            if (createdAt >= thirtyDaysAgo) newUsersLast30Days++;
          }
          if (user.is_active || user.isActive) {
            activeUsers++;
          } else {
            inactiveUsers++;
          }
        });
      } catch (e) {
        // Ignore if users API fails
      }

      // Load activity metrics
      const activitiesByType: Record<string, number> = {};
      const activitiesByDay: Array<{ date: string; count: number }> = [];

      try {
        const logsResponse = await apiClient.get('/v1/audit-trail/audit-trail?limit=1000&offset=0');
        const logsData = extractApiData<unknown[] | { data: unknown[] }>(logsResponse);
        const logs = (
          Array.isArray(logsData)
            ? logsData
            : logsData &&
                typeof logsData === 'object' &&
                'data' in logsData &&
                Array.isArray(logsData.data)
              ? logsData.data
              : []
        ) as AuditLog[];

        // Group by type
        logs.forEach((log) => {
          const eventType = String(log.event_type || log.action || 'unknown');
          activitiesByType[eventType] = (activitiesByType[eventType] || 0) + 1;
        });

        // Group by day (last 7 days)
        const dayCounts: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          if (dateStr && typeof dateStr === 'string') {
            dayCounts[dateStr] = 0;
          }
        }

        logs.forEach((log) => {
          if (log.timestamp && typeof log.timestamp === 'string') {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            if (logDate && dayCounts[logDate] !== undefined) {
              dayCounts[logDate] = (dayCounts[logDate] || 0) + 1;
            }
          }
        });

        activitiesByDay.push(
          ...Object.entries(dayCounts).map(([date, count]) => ({ date, count }))
        );
      } catch (e) {
        // Ignore if audit trail fails
      }

      // Load system metrics
      const logsByLevel: Record<string, number> = {};
      let recentErrors = 0;

      try {
        const auditResponse = await apiClient.get(
          '/v1/audit-trail/audit-trail?limit=1000&offset=0'
        );
        const auditData = extractApiData<unknown[] | { data: unknown[] }>(auditResponse);
        const auditLogs = (
          Array.isArray(auditData)
            ? auditData
            : auditData &&
                typeof auditData === 'object' &&
                'data' in auditData &&
                Array.isArray(auditData.data)
              ? auditData.data
              : []
        ) as AuditLog[];

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        auditLogs.forEach((log) => {
          const level = String(log.severity || log.level || 'info');
          logsByLevel[level] = (logsByLevel[level] || 0) + 1;

          if (
            (level === 'error' || level === 'critical') &&
            log.timestamp &&
            typeof log.timestamp === 'string'
          ) {
            const logDate = new Date(log.timestamp);
            if (logDate >= sevenDaysAgo) {
              recentErrors++;
            }
          }
        });
      } catch (e) {
        // Ignore if audit trail fails
      }

      // Load organization metrics
      let totalOrgs = 0;
      let activeOrgs = 0;
      let newOrgsLast7Days = 0;
      let newOrgsLast30Days = 0;

      try {
        const { teamsAPI } = await import('@/lib/api');
        const teamsResponse = await teamsAPI.list();
        if (teamsResponse.data) {
          const teamsData = teamsResponse.data.teams || teamsResponse.data;
          const teams = (Array.isArray(teamsData) ? teamsData : []) as Team[];
          totalOrgs = teams.length;

          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          teams.forEach((team) => {
            if (team.is_active || team.isActive) {
              activeOrgs++;
            }
            const createdAt = team.created_at ? new Date(team.created_at) : null;
            if (createdAt) {
              if (createdAt >= sevenDaysAgo) newOrgsLast7Days++;
              if (createdAt >= thirtyDaysAgo) newOrgsLast30Days++;
            }
          });
        }
      } catch (e) {
        // Ignore if teams API fails
      }

      // Load subscription metrics
      let totalSubscriptions = 0;
      let activeSubscriptions = 0;
      const subscriptionsByStatus: Record<string, number> = {};
      let newSubscriptionsLast7Days = 0;
      let newSubscriptionsLast30Days = 0;

      try {
        // Try to get subscriptions - this might not be available
        // Note: We can't easily get all subscriptions without an admin endpoint
        // This is a placeholder for when such an endpoint exists
        await apiClient.get('/v1/subscriptions/plans?limit=1000').catch(() => null);
      } catch (e) {
        // Ignore if subscriptions API fails
      }

      // Load content metrics
      let totalPosts = 0;
      let publishedPosts = 0;
      let totalPages = 0;
      let publishedPages = 0;

      try {
        // Load posts
        const postsResponse = await apiClient.get('/v1/posts?limit=1000').catch(() => null);
        if (postsResponse && postsResponse.data) {
          const posts = Array.isArray(postsResponse.data) ? postsResponse.data : [];
          totalPosts = posts.length;
          publishedPosts = posts.filter(
            (post: Post) => post.status === 'published' || post.status === 'PUBLISHED'
          ).length;
        }
      } catch (e) {
        // Ignore if posts API fails
      }

      try {
        // Load pages
        const pagesResponse = await apiClient.get('/v1/pages?limit=1000').catch(() => null);
        if (pagesResponse && Array.isArray(pagesResponse.data)) {
          const pages = pagesResponse.data as Page[];
          totalPages = pages.length;
          publishedPages = pages.filter(
            (page) => page.status === 'published' || page.status === 'PUBLISHED'
          ).length;
        }
      } catch (e) {
        // Ignore if pages API fails
      }

      // Load project metrics
      let totalProjects = 0;
      const projectsByStatus: Record<string, number> = {};

      try {
        const projectsResponse = await apiClient.get('/v1/projects?limit=1000').catch(() => null);
        if (projectsResponse && Array.isArray(projectsResponse.data)) {
          const projects = projectsResponse.data as Project[];
          totalProjects = projects.length;
          projects.forEach((project) => {
            const status = String(project.status || 'unknown');
            projectsByStatus[status] = (projectsByStatus[status] || 0) + 1;
          });
        }
      } catch (e) {
        // Ignore if projects API fails
      }

      setDetailedMetrics({
        rbac: {
          total_roles: roles.length,
          total_permissions: permissions.length,
          roles_distribution: rolesDistribution,
          permissions_by_resource: permissionsByResource,
        },
        users: {
          new_users_last_7_days: newUsersLast7Days,
          new_users_last_30_days: newUsersLast30Days,
          users_by_status: {
            active: activeUsers,
            inactive: inactiveUsers,
          },
        },
        activity: {
          activities_by_type: activitiesByType,
          activities_by_day: activitiesByDay,
        },
        system: {
          logs_by_level: logsByLevel,
          recent_errors: recentErrors,
        },
        organizations: {
          total: totalOrgs,
          active: activeOrgs,
          new_last_7_days: newOrgsLast7Days,
          new_last_30_days: newOrgsLast30Days,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          by_status: subscriptionsByStatus,
          new_last_7_days: newSubscriptionsLast7Days,
          new_last_30_days: newSubscriptionsLast30Days,
        },
        content: {
          total_posts: totalPosts,
          published_posts: publishedPosts,
          total_pages: totalPages,
          published_pages: publishedPages,
        },
        projects: {
          total: totalProjects,
          by_status: projectsByStatus,
        },
      });
    } catch (err: unknown) {
      // Error is already handled by setError above
      // Don't log to console in production
    } finally {
      setLoadingMetrics(false);
    }
  };

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats?.total_users || 0,
      description: "Nombre total d'utilisateurs",
      variant: 'default' as const,
    },
    {
      title: 'Utilisateurs actifs',
      value: stats?.active_users || 0,
      description: 'Utilisateurs actifs',
      variant: 'success' as const,
    },
    {
      title: 'Organisations',
      value: stats?.total_organizations || 0,
      description: "Nombre d'organisations",
      variant: 'default' as const,
    },
    {
      title: 'Logs système',
      value: stats?.total_logs || 0,
      description: 'Total des logs',
      variant: 'warning' as const,
    },
    {
      title: 'Activités récentes',
      value: stats?.recent_activities || 0,
      description: 'Activités des 7 derniers jours',
      variant: 'default' as const,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Statistiques"
        description="Visualiser les statistiques et métriques du système"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Statistiques' },
        ]}
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <>
          <Section title="Vue d'ensemble" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statCards.map((stat, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                    <Badge variant={stat.variant}>{stat.value.toLocaleString('fr-FR')}</Badge>
                  </div>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </Section>

          <Section title="Métriques détaillées" className="mt-8">
            {loadingMetrics ? (
              <Card>
                <div className="py-12 text-center">
                  <Loading />
                </div>
              </Card>
            ) : detailedMetrics ? (
              <div className="space-y-6">
                {/* RBAC Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistiques RBAC</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total des rôles</span>
                        <Badge variant="info">{detailedMetrics.rbac.total_roles}</Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total des permissions</span>
                        <Badge variant="info">{detailedMetrics.rbac.total_permissions}</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-3">Permissions par ressource</h4>
                      <div className="space-y-2">
                        {Object.entries(detailedMetrics.rbac.permissions_by_resource).map(
                          ([resource, count]) => (
                            <div key={resource} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground capitalize">
                                {resource}
                              </span>
                              <Badge variant="default">{count}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* User Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistiques des utilisateurs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Nouveaux (7 jours)</div>
                      <div className="text-2xl font-bold">
                        {detailedMetrics.users.new_users_last_7_days}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Nouveaux (30 jours)</div>
                      <div className="text-2xl font-bold">
                        {detailedMetrics.users.new_users_last_30_days}
                      </div>
                    </div>
                    <div className="p-4 bg-success/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Utilisateurs actifs</div>
                      <div className="text-2xl font-bold text-success">
                        {detailedMetrics.users.users_by_status.active}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Utilisateurs inactifs
                      </div>
                      <div className="text-2xl font-bold">
                        {detailedMetrics.users.users_by_status.inactive}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Activity Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistiques d'activité</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Activités par type</h4>
                      <div className="space-y-2">
                        {Object.entries(detailedMetrics.activity.activities_by_type).map(
                          ([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground capitalize">
                                {type}
                              </span>
                              <Badge variant="default">{count}</Badge>
                            </div>
                          )
                        )}
                        {Object.keys(detailedMetrics.activity.activities_by_type).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Aucune activité enregistrée
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        Activités par jour (7 derniers jours)
                      </h4>
                      <div className="space-y-2">
                        {detailedMetrics.activity.activities_by_day.map(({ date, count }) => {
                          const dateObj = new Date(date);
                          const dayName = dateObj.toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          });
                          return (
                            <div key={date} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{dayName}</span>
                              <Badge variant={count > 0 ? 'success' : 'default'}>{count}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* System Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistiques système</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Logs par niveau</h4>
                      <div className="space-y-2">
                        {Object.entries(detailedMetrics.system.logs_by_level).map(
                          ([level, count]) => {
                            const variant =
                              level === 'error' || level === 'critical'
                                ? 'error'
                                : level === 'warning'
                                  ? 'warning'
                                  : level === 'info'
                                    ? 'info'
                                    : 'default';
                            return (
                              <div key={level} className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground capitalize">
                                  {level}
                                </span>
                                <Badge variant={variant}>{count}</Badge>
                              </div>
                            );
                          }
                        )}
                        {Object.keys(detailedMetrics.system.logs_by_level).length === 0 && (
                          <p className="text-sm text-muted-foreground">Aucun log disponible</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="p-4 bg-error/10 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">
                          Erreurs récentes (7 jours)
                        </div>
                        <div className="text-2xl font-bold text-error">
                          {detailedMetrics.system.recent_errors}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Organizations Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistiques des organisations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Total</div>
                      <div className="text-2xl font-bold">
                        {detailedMetrics.organizations.total}
                      </div>
                    </div>
                    <div className="p-4 bg-success/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Actives</div>
                      <div className="text-2xl font-bold text-success">
                        {detailedMetrics.organizations.active}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Nouvelles (7 jours)</div>
                      <div className="text-2xl font-bold">
                        {detailedMetrics.organizations.new_last_7_days}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Nouvelles (30 jours)</div>
                      <div className="text-2xl font-bold">
                        {detailedMetrics.organizations.new_last_30_days}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Subscriptions Metrics */}
                {detailedMetrics.subscriptions.total > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Statistiques des abonnements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Total</div>
                        <div className="text-2xl font-bold">
                          {detailedMetrics.subscriptions.total}
                        </div>
                      </div>
                      <div className="p-4 bg-success/10 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Actifs</div>
                        <div className="text-2xl font-bold text-success">
                          {detailedMetrics.subscriptions.active}
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Nouveaux (7 jours)</div>
                        <div className="text-2xl font-bold">
                          {detailedMetrics.subscriptions.new_last_7_days}
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">
                          Nouveaux (30 jours)
                        </div>
                        <div className="text-2xl font-bold">
                          {detailedMetrics.subscriptions.new_last_30_days}
                        </div>
                      </div>
                    </div>
                    {Object.keys(detailedMetrics.subscriptions.by_status).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-3">Par statut</h4>
                        <div className="space-y-2">
                          {Object.entries(detailedMetrics.subscriptions.by_status).map(
                            ([status, count]) => (
                              <div key={status} className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground capitalize">
                                  {status}
                                </span>
                                <Badge variant="default">{count}</Badge>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Content Metrics */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Statistiques du contenu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Articles de blog</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <Badge variant="default">{detailedMetrics.content.total_posts}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Publiés</span>
                          <Badge variant="success">{detailedMetrics.content.published_posts}</Badge>
                        </div>
                        {detailedMetrics.content.total_posts > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-success h-2 rounded-full"
                                style={{
                                  width: `${(detailedMetrics.content.published_posts / detailedMetrics.content.total_posts) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round(
                                (detailedMetrics.content.published_posts /
                                  detailedMetrics.content.total_posts) *
                                  100
                              )}
                              % publiés
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-3">Pages</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <Badge variant="default">{detailedMetrics.content.total_pages}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Publiées</span>
                          <Badge variant="success">{detailedMetrics.content.published_pages}</Badge>
                        </div>
                        {detailedMetrics.content.total_pages > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-success h-2 rounded-full"
                                style={{
                                  width: `${(detailedMetrics.content.published_pages / detailedMetrics.content.total_pages) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round(
                                (detailedMetrics.content.published_pages /
                                  detailedMetrics.content.total_pages) *
                                  100
                              )}
                              % publiées
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Projects Metrics */}
                {detailedMetrics.projects.total > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Statistiques des projets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="p-4 bg-muted/50 rounded-lg mb-4">
                          <div className="text-sm text-muted-foreground mb-1">
                            Total des projets
                          </div>
                          <div className="text-2xl font-bold">{detailedMetrics.projects.total}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-3">Par statut</h4>
                        <div className="space-y-2">
                          {Object.entries(detailedMetrics.projects.by_status).map(
                            ([status, count]) => {
                              const variant =
                                status === 'completed'
                                  ? 'success'
                                  : status === 'in_progress'
                                    ? 'info'
                                    : status === 'cancelled'
                                      ? 'error'
                                      : 'default';
                              return (
                                <div key={status} className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground capitalize">
                                    {status}
                                  </span>
                                  <Badge variant={variant}>{count}</Badge>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <div className="p-6">
                  <p className="text-muted-foreground">
                    Impossible de charger les métriques détaillées.
                  </p>
                </div>
              </Card>
            )}
          </Section>
        </>
      )}
    </PageContainer>
  );
}
