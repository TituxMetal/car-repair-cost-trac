import { MaintenanceCategory } from './types'

export const maintenanceCategoryLabels: Record<MaintenanceCategory, string> = {
  'oil-change': 'Oil Change',
  'tires': 'Tires',
  'brakes': 'Brakes',
  'battery': 'Battery',
  'filters': 'Filters',
  'fluids': 'Fluids',
  'inspection': 'Inspection',
  'other': 'Other'
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount)
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatMileage = (mileage: number): string => {
  return new Intl.NumberFormat('en-US').format(mileage) + ' km'
}

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const isOverdue = (scheduledDate?: string, status?: string): boolean => {
  if (!scheduledDate || status === 'completed') return false
  return new Date(scheduledDate) < new Date()
}
