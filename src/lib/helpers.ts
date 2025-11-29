import { MaintenanceCategory, MaintenanceEvent } from './types'

export const maintenanceCategoryLabels: Record<MaintenanceCategory, string> = {
  'oil-change': 'Oil Change',
  'oil-level-check': 'Oil Level Check',
  'tire-pressure-check': 'Tire Pressure Check',
  'coolant-level-check': 'Coolant Level Check',
  'brake-fluid-check': 'Brake Fluid Check',
  'windshield-washer-check': 'Windshield Washer Fluid',
  'lights-check': 'Lights Check',
  'tires': 'Tires',
  'brakes': 'Brakes',
  'battery': 'Battery',
  'filters': 'Filters',
  'fluids': 'Fluids',
  'inspection': 'Inspection',
  'other': 'Other'
}

export interface WeeklyCheckDefinition {
  category: MaintenanceCategory
  title: string
  description: string
}

export const defaultWeeklyChecks: WeeklyCheckDefinition[] = [
  {
    category: 'oil-level-check',
    title: 'Weekly Oil Level Check',
    description: 'Check engine oil level to prevent engine damage from low oil. Top up if below minimum mark.'
  },
  {
    category: 'tire-pressure-check',
    title: 'Weekly Tire Pressure Check',
    description: 'Check tire pressure when cold. Proper pressure improves fuel efficiency and tire longevity.'
  },
  {
    category: 'coolant-level-check',
    title: 'Weekly Coolant Level Check',
    description: 'Check coolant reservoir level. Low coolant can cause engine overheating.'
  },
  {
    category: 'brake-fluid-check',
    title: 'Weekly Brake Fluid Check',
    description: 'Check brake fluid level in reservoir. Low fluid may indicate brake wear or leaks.'
  },
  {
    category: 'windshield-washer-check',
    title: 'Weekly Washer Fluid Check',
    description: 'Check and refill windshield washer fluid for clear visibility.'
  },
  {
    category: 'lights-check',
    title: 'Weekly Lights Check',
    description: 'Test all lights: headlights, brake lights, turn signals, and reverse lights.'
  }
]

export const createDefaultWeeklyChecks = (vehicleId: string): MaintenanceEvent[] => {
  const now = new Date()
  // Schedule first check for next week
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const scheduledDate = nextWeek.toISOString().split('T')[0]

  return defaultWeeklyChecks.map((check, index) => ({
    id: generateId() + `-${index}`,
    vehicleId,
    category: check.category,
    type: 'weekly-check' as const,
    title: check.title,
    description: check.description,
    scheduledDate,
    scheduledMileage: undefined,
    completedDate: '',
    completedMileage: undefined,
    status: 'scheduled' as const,
    appointmentTime: '',
    appointmentPlace: '',
    appointmentReason: '',
    // Recurring settings
    isRecurring: true,
    recurrenceType: 'weekly' as const,
    recurrenceValue: 1, // Every 1 week
    createdAt: now.toISOString()
  }))
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

export const calculateNextDueDate = (
  lastDate: string | undefined,
  interval: number,
  unit: 'days' | 'weeks' | 'months' | 'years'
): string => {
  const baseDate = lastDate ? new Date(lastDate) : new Date()
  const nextDate = new Date(baseDate)
  
  switch (unit) {
    case 'days':
      nextDate.setDate(nextDate.getDate() + interval)
      break
    case 'weeks':
      nextDate.setDate(nextDate.getDate() + interval * 7)
      break
    case 'months':
      nextDate.setMonth(nextDate.getMonth() + interval)
      break
    case 'years':
      nextDate.setFullYear(nextDate.getFullYear() + interval)
      break
  }
  
  return nextDate.toISOString().split('T')[0]
}

export const calculateNextDueMileage = (
  lastMileage: number | undefined,
  currentMileage: number,
  interval: number
): number => {
  const baseMileage = lastMileage || currentMileage
  return baseMileage + interval
}
