import { z } from 'zod'

// Vehicle schemas
export const vehicleCreateSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  purchaseDate: z.string().optional(),
  currentOdometer: z.number().int().min(0),
  fuelType: z.string().optional(),
  engineType: z.string().optional(),
})

export const vehicleUpdateSchema = vehicleCreateSchema.partial()

export type VehicleCreate = z.infer<typeof vehicleCreateSchema>
export type VehicleUpdate = z.infer<typeof vehicleUpdateSchema>

// Maintenance category enum
export const maintenanceCategorySchema = z.enum([
  'oil-change',
  'oil-level-check',
  'tire-pressure-check',
  'coolant-level-check',
  'brake-fluid-check',
  'windshield-washer-check',
  'lights-check',
  'tires',
  'brakes',
  'battery',
  'filters',
  'fluids',
  'inspection',
  'other',
])

// Maintenance type enum
export const maintenanceTypeSchema = z.enum([
  'service',
  'part-replacement',
  'mileage-check',
  'date-check',
  'weekly-check',
])

// Maintenance status enum
export const maintenanceStatusSchema = z.enum([
  'scheduled',
  'completed',
  'overdue',
])

// Maintenance event schemas
export const maintenanceEventCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  category: maintenanceCategorySchema,
  type: maintenanceTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledMileage: z.number().int().min(0).optional(),
  completedDate: z.string().optional(),
  completedMileage: z.number().int().min(0).optional(),
  status: maintenanceStatusSchema.default('scheduled'),
  appointmentTime: z.string().optional(),
  appointmentPlace: z.string().optional(),
  appointmentReason: z.string().optional(),
})

export const maintenanceEventUpdateSchema = maintenanceEventCreateSchema.partial().omit({ vehicleId: true })

export const maintenanceEventBulkCreateSchema = z.array(maintenanceEventCreateSchema)

export const maintenanceCompleteSchema = z.object({
  completedMileage: z.number().int().min(0).optional(),
})

export type MaintenanceEventCreate = z.infer<typeof maintenanceEventCreateSchema>
export type MaintenanceEventUpdate = z.infer<typeof maintenanceEventUpdateSchema>

// Expense schemas
export const expenseCreateSchema = z.object({
  eventId: z.string().optional(),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  date: z.string().min(1, 'Date is required'),
  garageName: z.string().optional(),
  description: z.string().optional(),
  partsCost: z.number().min(0).default(0),
  laborCost: z.number().min(0).default(0),
  otherCost: z.number().min(0).default(0),
})

export const expenseUpdateSchema = expenseCreateSchema.partial().omit({ vehicleId: true })

export type ExpenseCreate = z.infer<typeof expenseCreateSchema>
export type ExpenseUpdate = z.infer<typeof expenseUpdateSchema>

// Budget schemas
export const budgetCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  startDate: z.string().min(1, 'Start date is required'),
})

export const budgetUpdateSchema = budgetCreateSchema.partial().omit({ vehicleId: true })

export type BudgetCreate = z.infer<typeof budgetCreateSchema>
export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>
