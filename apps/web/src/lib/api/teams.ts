/**
 * Teams API Client
 * Client for team management API endpoints
 */

import { apiClient } from './client';
import type { ApiResponse } from '@modele/types';

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role_id: number;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
  role?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface TeamSettings {
  [key: string]: string | number | boolean | null | undefined;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  is_active: boolean;
  settings?: TeamSettings;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
  owner?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    name?: string;
  };
}

export interface TeamCreate {
  name: string;
  slug: string;
  description?: string;
  settings?: TeamSettings;
}

export interface TeamUpdate {
  name?: string;
  description?: string;
  settings?: TeamSettings;
}

export interface TeamMemberAdd {
  user_id: number;
  role_id: number;
}

export interface TeamMemberUpdate {
  role_id: number;
}

export interface TeamListResponse {
  teams: Team[];
  total: number;
}

export const teamsAPI = {
  list: async (skip = 0, limit = 100): Promise<ApiResponse<TeamListResponse>> => {
    return apiClient.get<TeamListResponse>('/v1/teams', {
      params: { skip, limit },
    });
  },
  listTeams: async (skip = 0, limit = 100): Promise<ApiResponse<TeamListResponse>> => {
    return apiClient.get<TeamListResponse>('/v1/teams', {
      params: { skip, limit },
    });
  },
  getTeam: async (teamId: number): Promise<ApiResponse<Team>> => {
    return apiClient.get<Team>(`/v1/teams/${teamId}`);
  },
  create: async (data: TeamCreate): Promise<ApiResponse<Team>> => {
    return apiClient.post<Team>('/v1/teams', data);
  },
  createTeam: async (data: TeamCreate): Promise<ApiResponse<Team>> => {
    return apiClient.post<Team>('/v1/teams', data);
  },
  updateTeam: async (teamId: number, data: TeamUpdate): Promise<ApiResponse<Team>> => {
    return apiClient.put<Team>(`/v1/teams/${teamId}`, data);
  },
  deleteTeam: async (teamId: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/v1/teams/${teamId}`);
  },
  getTeamMembers: async (teamId: number): Promise<ApiResponse<TeamMember[]>> => {
    return apiClient.get<TeamMember[]>(`/v1/teams/${teamId}/members`);
  },
  addTeamMember: async (teamId: number, data: TeamMemberAdd): Promise<ApiResponse<TeamMember>> => {
    return apiClient.post<TeamMember>(`/v1/teams/${teamId}/members`, data);
  },
  updateTeamMember: async (
    teamId: number,
    memberId: number,
    data: TeamMemberUpdate
  ): Promise<ApiResponse<TeamMember>> => {
    return apiClient.put<TeamMember>(`/v1/teams/${teamId}/members/${memberId}`, data);
  },
  removeTeamMember: async (teamId: number, memberId: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/v1/teams/${teamId}/members/${memberId}`);
  },
  getMyTeams: async (skip = 0, limit = 100): Promise<ApiResponse<TeamListResponse>> => {
    return apiClient.get<TeamListResponse>('/v1/teams', {
      params: { skip, limit },
    });
  },
};
