export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin?: string
  licensePlate?: string
  purchaseDate?: string
  currentOdometer: number
  fuelType?: string
  engineType?: string
}

export type MaintenanceCategory = 
  | 'oil-change'
  | 'oil-level-check'
  | 'tire-pressure-check'
  | 'coolant-level-check'
  | 'brake-fluid-check'
  | 'windshield-washer-check'
  | 'lights-check'
  | 'tires'
  | 'brakes'
  | 'battery'
  | 'filters'
  | 'fluids'
  | 'inspection'
  | 'other'

export type MaintenanceType = 'service' | 'part-replacement' | 'mileage-check' | 'date-check' | 'weekly-check'

export type MaintenanceStatus = 'scheduled' | 'completed' | 'overdue'

export interface MaintenanceEvent {
  id: string
  vehicleId: string
  category: MaintenanceCategory
  type: MaintenanceType
  title: string
  description?: string
  scheduledDate?: string
  scheduledMileage?: number
  completedDate?: string
  completedMileage?: number
  status: MaintenanceStatus
  appointmentTime?: string
  appointmentPlace?: string
  appointmentReason?: string
  createdAt: string
}

export interface Expense {
  id: string
  eventId: string
  vehicleId: string
  date: string
  garageName?: string
  description?: string
  partsCost: number
  laborCost: number
  otherCost: number
  totalCost: number
}

export interface Budget {
  id: string
  vehicleId: string
  amount: number
  period: 'monthly' | 'yearly'
  startDate: string
}
