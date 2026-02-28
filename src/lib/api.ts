import { Vehicle, MaintenanceEvent, Expense, Budget, RecurringReminder } from './types'

// API base URL - always use relative path since we serve fullstack from one origin
// This works for:
// - Local dev with Vite proxy
// - Production on Fly.io (same origin)
const API_BASE = '/api'

// Custom error class to include validation details
export class ApiError extends Error {
  status: number
  details?: Record<string, string[]>
  
  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }))
    
    // Extract validation errors if present
    if (errorBody.success === false && errorBody.error?.issues) {
      const details: Record<string, string[]> = {}
      for (const issue of errorBody.error.issues) {
        const path = issue.path.join('.') || 'general'
        if (!details[path]) details[path] = []
        details[path].push(issue.message)
      }
      throw new ApiError('Validation failed', response.status, details)
    }
    
    throw new ApiError(
      errorBody.error || errorBody.message || `HTTP ${response.status}`,
      response.status
    )
  }

  return response.json()
}

// Vehicles API
export const vehiclesApi = {
  getAll: () => fetchApi<Vehicle[]>('/vehicles'),
  
  getById: (id: string) => fetchApi<Vehicle>(`/vehicles/${id}`),
  
  create: (vehicle: Omit<Vehicle, 'id'>) =>
    fetchApi<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    }),
  
  update: (id: string, vehicle: Partial<Vehicle>) =>
    fetchApi<Vehicle>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/vehicles/${id}`, {
      method: 'DELETE',
    }),
}

// Maintenance API
export const maintenanceApi = {
  getAll: (vehicleId?: string) =>
    fetchApi<MaintenanceEvent[]>(
      vehicleId ? `/maintenance?vehicleId=${vehicleId}` : '/maintenance'
    ),
  
  getById: (id: string) => fetchApi<MaintenanceEvent>(`/maintenance/${id}`),
  
  getUpcoming: (vehicleId: string) =>
    fetchApi<MaintenanceEvent[]>(`/maintenance/upcoming/${vehicleId}`),
  
  getHistory: (vehicleId: string) =>
    fetchApi<MaintenanceEvent[]>(`/maintenance/history/${vehicleId}`),
  
  create: (event: Omit<MaintenanceEvent, 'id' | 'createdAt'>) =>
    fetchApi<MaintenanceEvent>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  
  createBulk: (events: Omit<MaintenanceEvent, 'id' | 'createdAt'>[]) =>
    fetchApi<MaintenanceEvent[]>('/maintenance/bulk', {
      method: 'POST',
      body: JSON.stringify(events),
    }),
  
  update: (id: string, event: Partial<MaintenanceEvent>) =>
    fetchApi<MaintenanceEvent>(`/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    }),
  
  markComplete: (id: string, completedMileage?: number) =>
    fetchApi<{ completed: MaintenanceEvent; next: MaintenanceEvent | null; message: string }>(`/maintenance/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completedMileage }),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/maintenance/${id}`, {
      method: 'DELETE',
    }),
}

// Expenses API
export const expensesApi = {
  getAll: (vehicleId?: string, eventId?: string) => {
    const params = new URLSearchParams()
    if (vehicleId) params.set('vehicleId', vehicleId)
    if (eventId) params.set('eventId', eventId)
    const query = params.toString()
    return fetchApi<Expense[]>(`/expenses${query ? `?${query}` : ''}`)
  },
  
  getById: (id: string) => fetchApi<Expense>(`/expenses/${id}`),
  
  getStats: (vehicleId: string, params?: { period?: string; startDate?: string }) => {
    const query = new URLSearchParams()
    if (params?.period) query.set('period', params.period)
    if (params?.startDate) query.set('startDate', params.startDate)
    const qs = query.toString()
    return fetchApi<{
      totalSpending: number
      partsCost: number
      laborCost: number
      otherCost: number
      count: number
    }>(`/expenses/stats/${vehicleId}${qs ? `?${qs}` : ''}`)
  },
  
  create: (expense: Omit<Expense, 'id'>) =>
    fetchApi<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
  
  update: (id: string, expense: Partial<Expense>) =>
    fetchApi<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/expenses/${id}`, {
      method: 'DELETE',
    }),
}

// Budgets API
export const budgetsApi = {
  getByVehicle: (vehicleId: string) =>
    fetchApi<Budget & { currentSpending: number }>(`/budgets/${vehicleId}`).catch(() => null),
  
  createOrUpdate: (budget: Omit<Budget, 'id'>) =>
    fetchApi<Budget>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    }),
  
  update: (id: string, budget: Partial<Budget>) =>
    fetchApi<Budget>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/budgets/${id}`, {
      method: 'DELETE',
    }),
}

// Reminders API
export const remindersApi = {
  getAll: (vehicleId?: string) =>
    fetchApi<RecurringReminder[]>(vehicleId ? `/reminders?vehicleId=${vehicleId}` : '/reminders'),

  getById: (id: string) => fetchApi<RecurringReminder>(`/reminders/${id}`),

  create: (reminder: Omit<RecurringReminder, 'id' | 'createdAt' | 'updatedAt'>) =>
    fetchApi<RecurringReminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    }),

  update: (id: string, reminder: Partial<RecurringReminder>) =>
    fetchApi<RecurringReminder>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminder),
    }),

  toggleActive: (id: string) =>
    fetchApi<RecurringReminder>(`/reminders/${id}/toggle`, { method: 'PATCH' }),

  markComplete: (id: string, data: { lastCompletedDate?: string; lastCompletedMileage?: number | null }) =>
    fetchApi<RecurringReminder>(`/reminders/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/reminders/${id}`, { method: 'DELETE' }),

  generateEvents: (vehicleId: string) =>
    fetchApi<{ created: number; events: MaintenanceEvent[] }>(
      `/reminders/${vehicleId}/generate-events`,
      { method: 'POST' }
    ),
}
