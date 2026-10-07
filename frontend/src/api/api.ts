import {
  User,
  Service,
  TokenItem,
  QueueStatus,
  QueueRecommendation,
  Counter,
  AdminDashboardData,
  AuthResponse,
  PriorityLevel,
} from '../types';

/**
 * Backend Base URL configuration.
 * Change this constant or set VITE_API_BASE_URL environment variable if the backend runs elsewhere.
 */
export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';

export function getApiBaseUrl(): string {
  return localStorage.getItem('smart_queue_api_base_url') || import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem('smart_queue_api_base_url', url);
}

export function resetApiBaseUrl(): void {
  localStorage.removeItem('smart_queue_api_base_url');
}

// Token storage key
const TOKEN_KEY = 'smart_queue_jwt_token';
const USER_KEY = 'smart_queue_user_data';
const SIMULATION_KEY = 'smart_queue_simulation_mode';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isSimulationMode(): boolean {
  return localStorage.getItem(SIMULATION_KEY) === 'true';
}

export function setSimulationMode(enabled: boolean): void {
  localStorage.setItem(SIMULATION_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('simulation_mode_changed'));
}

/**
 * Custom Error class with HTTP status
 */
export class ApiError extends Error {
  status: number;
  isBackendUnavailable: boolean;

  constructor(message: string, status: number = 500, isBackendUnavailable = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isBackendUnavailable = isBackendUnavailable;
  }
}

/**
 * Helper to execute fetch requests with Authorization headers and standardized error handling
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If simulation mode is explicitly enabled, use the simulation store
  if (isSimulationMode()) {
    return handleSimulationRequest<T>(endpoint, options);
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }

      switch (response.status) {
        case 401:
          clearAuthStorage();
          throw new ApiError(errorMessage || 'Session expired or invalid credentials. Please log in.', 401);
        case 403:
          throw new ApiError(errorMessage || 'Access denied. You do not have permission for this action.', 403);
        case 404:
          throw new ApiError(errorMessage || 'Resource not found.', 404);
        case 409:
          throw new ApiError(errorMessage || 'Conflict detected. You may already have an active token.', 409);
        case 500:
          throw new ApiError(errorMessage || 'Internal server error on the FastAPI backend.', 500);
        default:
          throw new ApiError(errorMessage || `Request failed with status ${response.status}`, response.status);
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }

    // Network error / Connection Refused / Backend is offline
    throw new ApiError('Backend unavailable. Please start the FastAPI server.', 0, true);
  }
}

// ==========================================
// API Methods
// ==========================================

export async function checkBackendHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health', { method: 'GET' });
}

export async function registerUser(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const token = res.access_token || res.token;
  if (token) setStoredToken(token);
  if (res.user) setStoredUser(res.user);
  return res;
}

export async function loginUser(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const token = res.access_token || res.token;
  if (token) setStoredToken(token);
  if (res.user) setStoredUser(res.user);
  return res;
}

export async function getServices(): Promise<Service[]> {
  return request<Service[]>('/services', { method: 'GET' });
}

export async function getService(serviceId: string | number): Promise<Service> {
  return request<Service>(`/services/${serviceId}`, { method: 'GET' });
}

export async function joinQueue(payload: { service_id: string | number; priority: PriorityLevel }): Promise<TokenItem> {
  return request<TokenItem>('/queues/join', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMyToken(): Promise<TokenItem | null> {
  try {
    return await request<TokenItem>('/queues/my-token', { method: 'GET' });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getQueueStatus(serviceId: string | number): Promise<QueueStatus> {
  return request<QueueStatus>(`/queues/${serviceId}/status`, { method: 'GET' });
}

export async function getTokenDetails(tokenId: string | number): Promise<TokenItem> {
  return request<TokenItem>(`/queues/token/${tokenId}`, { method: 'GET' });
}

export async function cancelToken(tokenId: string | number): Promise<{ message?: string; success?: boolean }> {
  return request<{ message?: string; success?: boolean }>(`/queues/token/${tokenId}/cancel`, {
    method: 'POST',
  });
}

export async function recommendQueue(): Promise<QueueRecommendation> {
  return request<QueueRecommendation>('/queues/recommend', { method: 'GET' });
}

export async function getCounters(): Promise<Counter[]> {
  return request<Counter[]>('/counters', { method: 'GET' });
}

export async function getCounterQueue(counterId: string | number): Promise<TokenItem[]> {
  return request<TokenItem[]>(`/counters/${counterId}/queue`, { method: 'GET' });
}

export async function callNextToken(counterId: string | number): Promise<TokenItem> {
  return request<TokenItem>(`/counters/${counterId}/next`, {
    method: 'POST',
  });
}

export async function serveToken(counterId: string | number, tokenId: string | number): Promise<TokenItem> {
  return request<TokenItem>(`/counters/${counterId}/serve/${tokenId}`, {
    method: 'POST',
  });
}

export async function skipToken(counterId: string | number, tokenId: string | number): Promise<TokenItem> {
  return request<TokenItem>(`/counters/${counterId}/skip/${tokenId}`, {
    method: 'POST',
  });
}

export async function cancelCounterToken(counterId: string | number, tokenId: string | number): Promise<TokenItem> {
  return request<TokenItem>(`/counters/${counterId}/cancel/${tokenId}`, {
    method: 'POST',
  });
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return request<AdminDashboardData>('/admin/dashboard', { method: 'GET' });
}

// ==========================================
// Simulation State (In-Memory / Local Storage)
// For demonstration preview when FastAPI server is offline
// ==========================================

const INITIAL_SERVICES: Service[] = [
  {
    id: 1,
    name: 'Banking & Financial',
    code: 'B',
    description: 'Cash deposits, withdrawals, demand drafts, account balance verification and queries.',
    active_counters: 2,
    waiting_count: 4,
    estimated_wait_minutes: 16,
  },
  {
    id: 2,
    name: 'Document Verification',
    code: 'D',
    description: 'Academic certificate attestation, KYC submissions, form verification, and biometric stamps.',
    active_counters: 1,
    waiting_count: 6,
    estimated_wait_minutes: 30,
  },
  {
    id: 3,
    name: 'Technical Support',
    code: 'S',
    description: 'Cloud portal access issues, credential resets, lab account clearance, and technical inquiries.',
    active_counters: 1,
    waiting_count: 2,
    estimated_wait_minutes: 8,
  },
];

interface SimState {
  services: Service[];
  tokens: TokenItem[];
  counters: Counter[];
  totalUsersCount: number;
}

function getSimState(): SimState {
  const saved = localStorage.getItem('smart_queue_sim_data');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  const initialTokens: TokenItem[] = [
    {
      id: 101,
      token_number: 'B-011',
      service_id: 1,
      service_name: 'Banking & Financial',
      user_id: 'user_seed_1',
      user_name: 'David Chen',
      position: 1,
      estimated_wait_minutes: 4,
      status: 'SERVING',
      priority: 'NORMAL',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      counter_number: 1,
    },
    {
      id: 102,
      token_number: 'B-012',
      service_id: 1,
      service_name: 'Banking & Financial',
      user_id: 'user_seed_2',
      user_name: 'Priya Sharma',
      position: 2,
      estimated_wait_minutes: 8,
      status: 'WAITING',
      priority: 'PRIORITY',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 103,
      token_number: 'B-013',
      service_id: 1,
      service_name: 'Banking & Financial',
      user_id: 'user_seed_3',
      user_name: 'Marcus Vance',
      position: 3,
      estimated_wait_minutes: 12,
      status: 'WAITING',
      priority: 'NORMAL',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 201,
      token_number: 'D-004',
      service_id: 2,
      service_name: 'Document Verification',
      user_id: 'user_seed_4',
      user_name: 'Aisha Al-Mansoor',
      position: 1,
      estimated_wait_minutes: 5,
      status: 'SERVING',
      priority: 'NORMAL',
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      counter_number: 3,
    },
    {
      id: 202,
      token_number: 'D-005',
      service_id: 2,
      service_name: 'Document Verification',
      user_id: 'user_seed_5',
      user_name: 'James Wilson',
      position: 2,
      estimated_wait_minutes: 15,
      status: 'WAITING',
      priority: 'NORMAL',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 301,
      token_number: 'S-008',
      service_id: 3,
      service_name: 'Technical Support',
      user_id: 'user_seed_6',
      user_name: 'Elena Rostova',
      position: 1,
      estimated_wait_minutes: 4,
      status: 'WAITING',
      priority: 'PRIORITY',
      created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
  ];

  const initialCounters: Counter[] = [
    {
      id: 1,
      counter_number: 1,
      service_id: 1,
      service_name: 'Banking & Financial',
      operator_name: 'Counter Operator 1',
      is_active: true,
      current_token: 'B-011',
      current_token_id: 101,
    },
    {
      id: 2,
      counter_number: 2,
      service_id: 1,
      service_name: 'Banking & Financial',
      operator_name: 'Counter Operator 2',
      is_active: true,
      current_token: null,
      current_token_id: null,
    },
    {
      id: 3,
      counter_number: 3,
      service_id: 2,
      service_name: 'Document Verification',
      operator_name: 'Desk Operator 3',
      is_active: true,
      current_token: 'D-004',
      current_token_id: 201,
    },
    {
      id: 4,
      counter_number: 4,
      service_id: 3,
      service_name: 'Technical Support',
      operator_name: 'Tech Desk 4',
      is_active: true,
      current_token: null,
      current_token_id: null,
    },
  ];

  const state: SimState = {
    services: INITIAL_SERVICES,
    tokens: initialTokens,
    counters: initialCounters,
    totalUsersCount: 42,
  };

  saveSimState(state);
  return state;
}

function saveSimState(state: SimState): void {
  localStorage.setItem('smart_queue_sim_data', JSON.stringify(state));
}

// Router for simulation handling
async function handleSimulationRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Add a slight realistic network delay (80ms)
  await new Promise((res) => setTimeout(res, 80));
  const method = (options.method || 'GET').toUpperCase();
  const state = getSimState();
  const currentUser = getStoredUser();

  // /auth/register
  if (endpoint === '/auth/register' && method === 'POST') {
    const body = JSON.parse((options.body as string) || '{}');
    const user: User = {
      id: `usr_${Date.now()}`,
      name: body.name || 'New User',
      email: body.email,
      role: 'USER',
    };
    state.totalUsersCount += 1;
    saveSimState(state);
    return {
      token: `sim_token_${user.id}`,
      user,
    } as unknown as T;
  }

  // /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const body = JSON.parse((options.body as string) || '{}');
    const email = body.email?.toLowerCase().trim();
    let role: User = {
      id: 'usr_default',
      name: 'Demonstration User',
      email: body.email,
      role: 'USER',
    };

    if (email === 'admin@example.com' || email.includes('admin')) {
      role = {
        id: 'admin_1',
        name: 'System Administrator',
        email: body.email,
        role: 'ADMIN',
      };
    } else if (email === 'counter@example.com' || email.includes('counter')) {
      role = {
        id: 'counter_1',
        name: 'Counter Operator 1',
        email: body.email,
        role: 'COUNTER',
        assigned_counter_id: 1,
      };
    } else {
      role = {
        id: 'user_1',
        name: 'Student Demo User',
        email: body.email,
        role: 'USER',
      };
    }

    return {
      token: `sim_jwt_${role.id}_${Date.now()}`,
      user: role,
    } as unknown as T;
  }

  // /services
  if (endpoint === '/services' && method === 'GET') {
    return state.services as unknown as T;
  }

  // /services/:id
  const serviceMatch = endpoint.match(/^\/services\/(\w+)$/);
  if (serviceMatch && method === 'GET') {
    const sId = Number(serviceMatch[1]);
    const service = state.services.find((s) => s.id === sId);
    if (!service) throw new ApiError('Service not found', 404);
    return service as unknown as T;
  }

  // /queues/recommend
  if (endpoint === '/queues/recommend' && method === 'GET') {
    // Recommend service with lowest estimated wait time
    const sorted = [...state.services].sort((a, b) => a.estimated_wait_minutes - b.estimated_wait_minutes);
    const best = sorted[0] || state.services[0];
    const rec: QueueRecommendation = {
      service_id: best.id,
      service_name: best.name,
      estimated_wait_minutes: best.estimated_wait_minutes,
      waiting_count: best.waiting_count,
      active_counters: best.active_counters,
      reason: 'Based on current queue length and available counters.',
    };
    return rec as unknown as T;
  }

  // /queues/my-token
  if (endpoint === '/queues/my-token' && method === 'GET') {
    if (!currentUser) throw new ApiError('Not logged in', 401);
    const activeToken = state.tokens.find(
      (t) => (t.user_id === currentUser.id || t.user_name === currentUser.name) && (t.status === 'WAITING' || t.status === 'SERVING')
    );
    if (!activeToken) throw new ApiError('No active token found', 404);
    return activeToken as unknown as T;
  }

  // /queues/join
  if (endpoint === '/queues/join' && method === 'POST') {
    const body = JSON.parse((options.body as string) || '{}');
    const service = state.services.find((s) => s.id === Number(body.service_id));
    if (!service) throw new ApiError('Service not found', 404);

    // Check if user already has an active token
    const existing = state.tokens.find(
      (t) => (t.user_id === currentUser?.id || t.user_name === currentUser?.name) && (t.status === 'WAITING' || t.status === 'SERVING')
    );
    if (existing) {
      throw new ApiError(`You already have active token ${existing.token_number} in ${existing.service_name}`, 409);
    }

    const nextNum = Math.floor(10 + Math.random() * 89);
    const tokenNumber = `${service.code}-0${nextNum}`;
    const waitTime = Math.max(4, service.waiting_count * 4);
    const position = service.waiting_count + 1;

    const newToken: TokenItem = {
      id: Date.now(),
      token_number: tokenNumber,
      service_id: service.id,
      service_name: service.name,
      user_id: currentUser?.id || 'demo_user',
      user_name: currentUser?.name || 'Guest User',
      position,
      estimated_wait_minutes: waitTime,
      status: 'WAITING',
      priority: body.priority || 'NORMAL',
      created_at: new Date().toISOString(),
    };

    state.tokens.push(newToken);
    service.waiting_count += 1;
    service.estimated_wait_minutes = Math.max(4, service.waiting_count * 4);
    saveSimState(state);

    return newToken as unknown as T;
  }

  // /queues/:id/status
  const statusMatch = endpoint.match(/^\/queues\/(\w+)\/status$/);
  if (statusMatch && method === 'GET') {
    const sId = Number(statusMatch[1]);
    const service = state.services.find((s) => s.id === sId) || state.services[0];
    const servingToken = state.tokens.find((t) => t.service_id === service.id && t.status === 'SERVING');
    const waitingTokens = state.tokens.filter((t) => t.service_id === service.id && t.status === 'WAITING');

    const status: QueueStatus = {
      service_id: service.id,
      service_name: service.name,
      service_code: service.code,
      current_token: servingToken ? servingToken.token_number : null,
      users_ahead: waitingTokens.length,
      estimated_wait_minutes: service.estimated_wait_minutes,
      active_counters: service.active_counters,
      waiting_count: waitingTokens.length,
      status: waitingTokens.length > 0 || servingToken ? 'ACTIVE' : 'IDLE',
    };
    return status as unknown as T;
  }

  // /queues/token/:id/cancel
  const cancelMatch = endpoint.match(/^\/queues\/token\/(\w+)\/cancel$/);
  if (cancelMatch && method === 'POST') {
    const tId = cancelMatch[1];
    const token = state.tokens.find((t) => String(t.id) === String(tId));
    if (!token) throw new ApiError('Token not found', 404);

    token.status = 'CANCELLED';
    const service = state.services.find((s) => s.id === token.service_id);
    if (service && service.waiting_count > 0) {
      service.waiting_count = Math.max(0, service.waiting_count - 1);
      service.estimated_wait_minutes = Math.max(2, service.waiting_count * 4);
    }
    saveSimState(state);
    return { success: true, message: 'Token cancelled successfully' } as unknown as T;
  }

  // /counters
  if (endpoint === '/counters' && method === 'GET') {
    return state.counters as unknown as T;
  }

  // /counters/:id/queue
  const counterQueueMatch = endpoint.match(/^\/counters\/(\w+)\/queue$/);
  if (counterQueueMatch && method === 'GET') {
    const cId = Number(counterQueueMatch[1]);
    const counter = state.counters.find((c) => c.id === cId);
    if (!counter) throw new ApiError('Counter not found', 404);

    // Waiting tokens for this counter's service, sorted priority first, then date
    const waiting = state.tokens
      .filter((t) => t.service_id === counter.service_id && t.status === 'WAITING')
      .sort((a, b) => {
        if (a.priority === 'PRIORITY' && b.priority !== 'PRIORITY') return -1;
        if (b.priority === 'PRIORITY' && a.priority !== 'PRIORITY') return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    return waiting as unknown as T;
  }

  // /counters/:id/next
  const counterNextMatch = endpoint.match(/^\/counters\/(\w+)\/next$/);
  if (counterNextMatch && method === 'POST') {
    const cId = Number(counterNextMatch[1]);
    const counter = state.counters.find((c) => c.id === cId);
    if (!counter) throw new ApiError('Counter not found', 404);

    // If currently serving someone, mark them as served first
    if (counter.current_token_id) {
      const prev = state.tokens.find((t) => String(t.id) === String(counter.current_token_id));
      if (prev && prev.status === 'SERVING') {
        prev.status = 'SERVED';
        prev.served_at = new Date().toISOString();
      }
    }

    // Find next waiting token
    const waitingList = state.tokens
      .filter((t) => t.service_id === counter.service_id && t.status === 'WAITING')
      .sort((a, b) => {
        if (a.priority === 'PRIORITY' && b.priority !== 'PRIORITY') return -1;
        if (b.priority === 'PRIORITY' && a.priority !== 'PRIORITY') return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    if (waitingList.length === 0) {
      counter.current_token = null;
      counter.current_token_id = null;
      saveSimState(state);
      throw new ApiError('No waiting tokens in this queue', 404);
    }

    const nextToken = waitingList[0];
    nextToken.status = 'SERVING';
    nextToken.counter_number = counter.counter_number;
    counter.current_token = nextToken.token_number;
    counter.current_token_id = nextToken.id;

    const service = state.services.find((s) => s.id === counter.service_id);
    if (service && service.waiting_count > 0) {
      service.waiting_count = Math.max(0, service.waiting_count - 1);
      service.estimated_wait_minutes = Math.max(2, service.waiting_count * 4);
    }

    saveSimState(state);
    return nextToken as unknown as T;
  }

  // /counters/:id/serve/:tokenId
  const serveMatch = endpoint.match(/^\/counters\/(\w+)\/serve\/(\w+)$/);
  if (serveMatch && method === 'POST') {
    const cId = Number(serveMatch[1]);
    const tId = serveMatch[2];
    const counter = state.counters.find((c) => c.id === cId);
    const token = state.tokens.find((t) => String(t.id) === String(tId));
    if (!token) throw new ApiError('Token not found', 404);

    token.status = 'SERVED';
    token.served_at = new Date().toISOString();
    if (counter) {
      counter.current_token = null;
      counter.current_token_id = null;
    }
    saveSimState(state);
    return token as unknown as T;
  }

  // /counters/:id/skip/:tokenId
  const skipMatch = endpoint.match(/^\/counters\/(\w+)\/skip\/(\w+)$/);
  if (skipMatch && method === 'POST') {
    const cId = Number(skipMatch[1]);
    const tId = serveMatch ? serveMatch[2] : skipMatch[2];
    const counter = state.counters.find((c) => c.id === cId);
    const token = state.tokens.find((t) => String(t.id) === String(tId));
    if (!token) throw new ApiError('Token not found', 404);

    token.status = 'SKIPPED';
    if (counter) {
      counter.current_token = null;
      counter.current_token_id = null;
    }
    saveSimState(state);
    return token as unknown as T;
  }

  // /counters/:id/cancel/:tokenId
  const cancelCounterMatch = endpoint.match(/^\/counters\/(\w+)\/cancel\/(\w+)$/);
  if (cancelCounterMatch && method === 'POST') {
    const cId = Number(cancelCounterMatch[1]);
    const tId = cancelCounterMatch[2];
    const counter = state.counters.find((c) => c.id === cId);
    const token = state.tokens.find((t) => String(t.id) === String(tId));
    if (!token) throw new ApiError('Token not found', 404);

    token.status = 'CANCELLED';
    if (counter && String(counter.current_token_id) === String(tId)) {
      counter.current_token = null;
      counter.current_token_id = null;
    }
    saveSimState(state);
    return token as unknown as T;
  }

  // /admin/dashboard
  if (endpoint === '/admin/dashboard' && method === 'GET') {
    const waitingTokens = state.tokens.filter((t) => t.status === 'WAITING').length;
    const servedTokens = state.tokens.filter((t) => t.status === 'SERVED').length;
    const skippedTokens = state.tokens.filter((t) => t.status === 'SKIPPED').length;
    const cancelledTokens = state.tokens.filter((t) => t.status === 'CANCELLED').length;
    const activeCounters = state.counters.filter((c) => c.is_active).length;

    const servicesSummary = state.services.map((s) => {
      const sTokens = state.tokens.filter((t) => t.service_id === s.id);
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        waiting_count: sTokens.filter((t) => t.status === 'WAITING').length,
        served_count: sTokens.filter((t) => t.status === 'SERVED').length + 5, // historical baseline
        active_counters: s.active_counters,
        avg_wait_minutes: s.estimated_wait_minutes,
      };
    });

    const adminData: AdminDashboardData = {
      total_users: state.totalUsersCount,
      active_counters: activeCounters,
      waiting_tokens: waitingTokens,
      served_tokens: servedTokens + 28,
      skipped_tokens: skippedTokens + 3,
      cancelled_tokens: cancelledTokens + 2,
      services: servicesSummary,
    };
    return adminData as unknown as T;
  }

  // /health
  if (endpoint === '/health') {
    return { status: 'ok' } as unknown as T;
  }

  throw new ApiError(`Simulation endpoint not found: ${endpoint}`, 404);
}
