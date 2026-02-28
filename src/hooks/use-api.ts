import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi, maintenanceApi, expensesApi, budgetsApi, remindersApi } from '@/lib/api'
import { Vehicle, MaintenanceEvent, Expense, Budget, RecurringReminder } from '@/lib/types'

// Vehicle hooks
export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => vehiclesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) =>
      vehiclesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

// Maintenance hooks
export function useMaintenanceEvents(vehicleId?: string) {
  return useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: () => maintenanceApi.getAll(vehicleId),
  })
}

export function useCreateMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export function useCreateMaintenanceEventsBulk() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: maintenanceApi.createBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export function useUpdateMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceEvent> }) =>
      maintenanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export function useMarkMaintenanceComplete() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, completedMileage }: { id: string; completedMileage?: number }) =>
      maintenanceApi.markComplete(id, completedMileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export function useDeleteMaintenanceEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: maintenanceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

// Expense hooks
export function useExpenses(vehicleId?: string, eventId?: string) {
  return useQuery({
    queryKey: ['expenses', vehicleId, eventId],
    queryFn: () => expensesApi.getAll(vehicleId, eventId),
  })
}

export function useExpenseStats(vehicleId: string, params?: { period?: string; startDate?: string }) {
  return useQuery({
    queryKey: [
      'expenses',
      'stats',
      vehicleId,
      params?.period ?? null,
      params?.startDate ?? null,
    ],
    queryFn: () => expensesApi.getStats(vehicleId, params),
    enabled: !!vehicleId,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

// Budget hooks
export function useBudget(vehicleId: string) {
  return useQuery({
    queryKey: ['budget', vehicleId],
    queryFn: () => budgetsApi.getByVehicle(vehicleId),
    enabled: !!vehicleId,
    retry: false, // Don't retry on 404
  })
}

export function useCreateOrUpdateBudget() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (budget: Omit<Budget, 'id'>) => budgetsApi.createOrUpdate(budget),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget', variables.vehicleId] })
    },
  })
}

// Reminder hooks
export const useReminders = (vehicleId?: string) =>
  useQuery({
    queryKey: ['reminders', vehicleId],
    queryFn: () => remindersApi.getAll(vehicleId),
    enabled: !!vehicleId,
  })

export const useCreateReminder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: remindersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export const useUpdateReminder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringReminder> }) =>
      remindersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export const useToggleReminder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: remindersApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export const useDeleteReminder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: remindersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export const useGenerateReminderEvents = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: remindersApi.generateEvents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}
