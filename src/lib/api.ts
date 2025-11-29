import { Vehicle, MaintenanceEvent, Expense, Budget } from './types'

// Use relative path - Vite proxy will forward /api to the backend
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
    fetchApi<MaintenanceEvent>(`/maintenance/${id}/complete`, {
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
  
  getStats: (vehicleId: string) =>
    fetchApi<{
      totalSpending: number
      partsCost: number
      laborCost: number
      otherCost: number
      count: number
    }>(`/expenses/stats/${vehicleId}`),
  
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
    fetchApi<Budget>(`/budgets/${vehicleId}`).catch(() => null),
  
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
