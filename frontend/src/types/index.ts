export type UserRole = 'USER' | 'COUNTER' | 'ADMIN';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  assigned_counter_id?: string | number | null;
}

export type TokenStatus = 'WAITING' | 'SERVING' | 'SERVED' | 'SKIPPED' | 'CANCELLED';
export type PriorityLevel = 'NORMAL' | 'PRIORITY';

export interface Service {
  id: string | number;
  name: string;
  code: string;
  description: string;
  active_counters: number;
  waiting_count: number;
  estimated_wait_minutes: number;
}

export interface TokenItem {
  id: string | number;
  token_number: string;
  service_id: string | number;
  service_name: string;
  user_id?: string | number;
  user_name?: string;
  position: number;
  estimated_wait_minutes: number;
  status: TokenStatus;
  priority: PriorityLevel;
  created_at: string;
  served_at?: string | null;
  counter_number?: number | string | null;
}

export interface QueueStatus {
  service_id: string | number;
  service_name: string;
  service_code?: string;
  current_token: string | null;
  users_ahead: number;
  estimated_wait_minutes: number;
  active_counters: number;
  waiting_count: number;
  status?: string;
}

export interface QueueRecommendation {
  service_id: string | number;
  service_name: string;
  estimated_wait_minutes: number;
  reason: string;
  waiting_count?: number;
  active_counters?: number;
}

export interface Counter {
  id: string | number;
  counter_number: number;
  service_id: string | number;
  service_name: string;
  operator_name?: string | null;
  is_active: boolean;
  current_token?: string | null;
  current_token_id?: string | number | null;
}

export interface AdminDashboardData {
  total_users: number;
  active_counters: number;
  waiting_tokens: number;
  served_tokens: number;
  skipped_tokens: number;
  cancelled_tokens: number;
  services: {
    id: string | number;
    name: string;
    code: string;
    waiting_count: number;
    served_count: number;
    active_counters: number;
    avg_wait_minutes: number;
  }[];
}

export interface AuthResponse {
  access_token?: string;
  token?: string;
  token_type?: string;
  user: User;
}
