import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi, maintenanceApi, expensesApi, budgetsApi, remindersApi } from '@/lib/api'
import { Vehicle, MaintenanceEvent, Expense, Budget, RecurringReminder } from '@/lib/types'

// Vehicle hooks
export const useVehicles = () =>
  useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  })

export const useVehicle = (id: string) =>
  useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => vehiclesApi.getById(id),
    enabled: !!id,
  })

export const useCreateVehicle = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) =>
      vehiclesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

// Maintenance hooks
export const useMaintenanceEvents = (vehicleId?: string) =>
  useQuery({
    queryKey: ['maintenance', vehicleId],
    queryFn: () => maintenanceApi.getAll(vehicleId),
  })

export const useCreateMaintenanceEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export const useCreateMaintenanceEventsBulk = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: maintenanceApi.createBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export const useUpdateMaintenanceEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceEvent> }) =>
      maintenanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export const useMarkMaintenanceComplete = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, completedMileage }: { id: string; completedMileage?: number }) =>
      maintenanceApi.markComplete(id, completedMileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

export const useDeleteMaintenanceEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: maintenanceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
  })
}

// Expense hooks
export const useExpenses = (vehicleId?: string, eventId?: string) =>
  useQuery({
    queryKey: ['expenses', vehicleId, eventId],
    queryFn: () => expensesApi.getAll(vehicleId, eventId),
  })

export const useExpenseStats = (vehicleId: string, params?: { period?: string; startDate?: string }) =>
  useQuery({
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

export const useCreateExpense = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

// Budget hooks
export const useBudget = (vehicleId: string) =>
  useQuery({
    queryKey: ['budget', vehicleId],
    queryFn: () => budgetsApi.getByVehicle(vehicleId),
    enabled: !!vehicleId,
    retry: false, // Don't retry on 404
  })

export const useCreateOrUpdateBudget = () => {
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
