import { useState, useEffect } from 'react'
import { Vehicle, MaintenanceEvent, Expense, Budget, MaintenanceType, MaintenanceStatus, MaintenanceRecurrenceType, RecurringReminder } from '@/lib/types'
import { defaultWeeklyChecks } from '@/lib/helpers'
import { ApiError } from '@/lib/api'
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useMaintenanceEvents,
  useCreateMaintenanceEvent,
  useCreateMaintenanceEventsBulk,
  useUpdateMaintenanceEvent,
  useMarkMaintenanceComplete,
  useDeleteMaintenanceEvent,
  useExpenses,

  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useBudget,
  useCreateOrUpdateBudget,
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useToggleReminder,
  useDeleteReminder,
} from '@/hooks/use-api'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VehicleForm } from '@/components/VehicleForm'
import { VehicleProfile } from '@/components/VehicleProfile'
import { MaintenanceEventForm } from '@/components/MaintenanceEventForm'
import { MaintenanceTimeline } from '@/components/MaintenanceTimeline'
import { MaintenanceCalendar } from '@/components/MaintenanceCalendar'
import { ExpenseForm } from '@/components/ExpenseForm'
import { ExpenseHistory } from '@/components/ExpenseHistory'
import { BudgetOverview } from '@/components/BudgetOverview'
import { UpcomingChecks } from '@/components/UpcomingChecks'
import { ChecksHistory } from '@/components/ChecksHistory'
import { RecurringReminderList } from '@/components/RecurringReminderList'
import { RecurringReminderForm } from '@/components/RecurringReminderForm'
import { VehicleSelector } from '@/components/VehicleSelector'
import { Plus, Car, Spinner } from '@phosphor-icons/react'

type DialogMode = 
  | { type: 'none' }
  | { type: 'vehicle'; vehicle?: Vehicle }
  | { type: 'maintenance'; event?: MaintenanceEvent }
  | { type: 'expense'; eventId?: string; expense?: Expense }
  | { type: 'reminder'; reminder?: RecurringReminder }

const App = () => {
  const [dialogMode, setDialogMode] = useState<DialogMode>({ type: 'none' })
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  // Fetch data from backend
  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles()

  // Default to first vehicle if no selection made
  const vehicle = vehicles?.find(v => v.id === selectedVehicleId) || vehicles?.[0] || null

  // Sync selectedVehicleId with first vehicle once loaded
  useEffect(() => {
    if (vehicles && vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id)
    }
  }, [vehicles, selectedVehicleId])
  
  // Log error for debugging
  if (vehiclesError) {
    console.error('Failed to fetch vehicles:', vehiclesError)
  }
  
  const { data: maintenanceEvents = [], isLoading: maintenanceLoading } = useMaintenanceEvents(vehicle?.id)
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(vehicle?.id)
  const { data: budget } = useBudget(vehicle?.id || '')
  const { data: reminders = [] } = useReminders(vehicle?.id)

  // Mutations
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const createMaintenanceEvent = useCreateMaintenanceEvent()
  const createMaintenanceEventsBulk = useCreateMaintenanceEventsBulk()
  const updateMaintenanceEvent = useUpdateMaintenanceEvent()
  const markComplete = useMarkMaintenanceComplete()
  const deleteMaintenanceEvent = useDeleteMaintenanceEvent()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const createOrUpdateBudget = useCreateOrUpdateBudget()
  const createReminder = useCreateReminder()
  const updateReminder = useUpdateReminder()
  const toggleReminder = useToggleReminder()
  const deleteReminder = useDeleteReminder()

  // Helper to show detailed error messages
  const showError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof ApiError && error.details) {
      const messages = Object.entries(error.details)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('\n')
      toast.error(`Validation failed:\n${messages}`, { duration: 5000 })
      return
    }

    if (error instanceof ApiError) {
      toast.error(`${fallbackMessage}: ${error.message}`)
      return
    }

    if (error instanceof Error) {
      toast.error(`${fallbackMessage}: ${error.message}`)
      return
    }

    toast.error(fallbackMessage)
  }

  const handleSaveVehicle = async (vehicleData: Vehicle) => {
    try {
      if (dialogMode.type === 'vehicle' && dialogMode.vehicle && dialogMode.vehicle.id) {
        await updateVehicle.mutateAsync({ id: dialogMode.vehicle.id, data: vehicleData })
        setDialogMode({ type: 'none' })
        toast.success('Vehicle updated successfully')
        return
      }
      const { id: _id, ...vehicleWithoutId } = vehicleData
      const newVehicle = await createVehicle.mutateAsync(vehicleWithoutId)
      
      // Create default weekly checks
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const scheduledDate = nextWeek.toISOString().split('T')[0]
      
      const weeklyChecks: Omit<MaintenanceEvent, 'id' | 'createdAt'>[] = defaultWeeklyChecks.map(check => ({
        vehicleId: newVehicle.id,
        category: check.category,
        type: 'weekly-check' as MaintenanceType,
        title: check.title,
        description: check.description,
        scheduledDate,
        status: 'scheduled' as MaintenanceStatus,
        isRecurring: true,
        recurrenceType: 'weekly' as MaintenanceRecurrenceType,
        recurrenceValue: 1,
      }))
      
      await createMaintenanceEventsBulk.mutateAsync(weeklyChecks)
      setSelectedVehicleId(newVehicle.id)
      setDialogMode({ type: 'none' })
      toast.success('Vehicle saved with weekly maintenance checks')
    } catch (error) {
      showError(error, 'Failed to save vehicle')
    }
  }

  const handleSaveMaintenanceEvent = async (event: MaintenanceEvent) => {
    try {
      const { id: _id, createdAt: _createdAt, ...eventData } = event
      
      if (maintenanceEvents.find(e => e.id === event.id)) {
        await updateMaintenanceEvent.mutateAsync({ id: event.id, data: eventData })
        setDialogMode({ type: 'none' })
        toast.success('Maintenance event updated')
        return
      }
      await createMaintenanceEvent.mutateAsync(eventData)
      setDialogMode({ type: 'none' })
      toast.success('Maintenance event saved')
    } catch (error) {
      showError(error, 'Failed to save maintenance event')
    }
  }

  const handleSaveExpense = async (expense: Expense) => {
    try {
      const { id: _id, ...expenseData } = expense
      
      if (expenses.find(e => e.id === expense.id)) {
        await updateExpense.mutateAsync({ id: expense.id, data: expenseData })
        setDialogMode({ type: 'none' })
        toast.success('Expense updated')
        return
      }
      await createExpense.mutateAsync(expenseData)
      setDialogMode({ type: 'none' })
      toast.success('Expense recorded')
    } catch (error) {
      showError(error, 'Failed to save expense')
    }
  }

  const handleMarkComplete = async (eventId: string) => {
    try {
      await markComplete.mutateAsync({ 
        id: eventId, 
        completedMileage: vehicle?.currentOdometer 
      })
      toast.success('Maintenance marked as complete')
    } catch (error) {
      showError(error, 'Failed to mark as complete')
    }
  }

  const handleDeleteMaintenanceEvent = async (eventId: string) => {
    try {
      await deleteMaintenanceEvent.mutateAsync(eventId)
      toast.success('Maintenance event deleted')
    } catch (error) {
      showError(error, 'Failed to delete maintenance event')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense.mutateAsync(expenseId)
      toast.success('Expense deleted')
    } catch (error) {
      showError(error, 'Failed to delete expense')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setDialogMode({ type: 'expense', expense })
  }

  const handleUpdateBudget = async (updatedBudget: Budget) => {
    try {
      await createOrUpdateBudget.mutateAsync({
        ...updatedBudget,
        vehicleId: vehicle?.id || '',
      })
      toast.success('Budget updated')
    } catch (error) {
      showError(error, 'Failed to update budget')
    }
  }

  const handleSaveReminder = async (reminder: RecurringReminder) => {
    try {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...reminderData } = reminder
      if (reminders.find(r => r.id === reminder.id)) {
        await updateReminder.mutateAsync({ id: reminder.id, data: reminderData })
        setDialogMode({ type: 'none' })
        toast.success('Reminder updated')
        return
      }
      await createReminder.mutateAsync(reminderData)
      setDialogMode({ type: 'none' })
      toast.success('Reminder saved')
    } catch (error) {
      showError(error, 'Failed to save reminder')
    }
  }

  const handleToggleReminder = async (reminderId: string) => {
    try {
      await toggleReminder.mutateAsync(reminderId)
    } catch (error) {
      showError(error, 'Failed to toggle reminder')
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder.mutateAsync(reminderId)
      toast.success('Reminder deleted')
    } catch (error) {
      showError(error, 'Failed to delete reminder')
    }
  }

  // Loading state
  if (vehiclesLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <Toaster position="top-center" theme="dark" richColors />
        <div className="text-center">
          <Spinner className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Error state - show error with retry and option to add vehicle anyway
  if (vehiclesError) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <Toaster position="top-center" theme="dark" richColors />
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Car className="text-destructive mx-auto mb-4" size={64} />
            <h1 className="text-3xl font-semibold mb-2">Connection Error</h1>
            <p className="text-muted-foreground mb-4">
              Could not connect to the server. Make sure the backend is running on port 3001.
            </p>
            <p className="text-xs text-destructive mb-4">
              {vehiclesError instanceof Error ? vehiclesError.message : 'Unknown error'}
            </p>
          </div>
          <div className="bg-card border-2 border-border rounded-md shadow-lg">
            <VehicleForm onSave={handleSaveVehicle} />
          </div>
        </div>
      </div>
    )
  }

  // No vehicle - show form to add one
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <Toaster position="top-center" theme="dark" richColors />
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Car className="text-accent mx-auto mb-4" size={64} />
            <h1 className="text-3xl font-semibold mb-2">Car Maintenance Tracker</h1>
            <p className="text-muted-foreground">
              Start by adding your vehicle to track maintenance and costs
            </p>
          </div>
          <div className="bg-card border-2 border-border rounded-md shadow-lg">
            <VehicleForm onSave={handleSaveVehicle} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" theme="dark" richColors />
      
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="text-accent" size={32} />
              <div>
                <h1 className="text-xl font-semibold">Car Maintenance Tracker</h1>
                <p className="text-xs text-muted-foreground">Track maintenance and costs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {vehicles && vehicles.length > 0 && (
                <VehicleSelector
                  vehicles={vehicles}
                  selectedId={vehicle.id}
                  onSelect={setSelectedVehicleId}
                  onAddNew={() => setDialogMode({ type: 'vehicle' })}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogMode({ type: 'vehicle' })}
              >
                <Plus size={16} />
                Add Vehicle
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Checks Section - Most Important! */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UpcomingChecks vehicleId={vehicle.id} />
              <ChecksHistory vehicleId={vehicle.id} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VehicleProfile
                vehicle={vehicle}
                onEdit={() => setDialogMode({ type: 'vehicle', vehicle })}
              />
              <BudgetOverview
                budget={budget || undefined}
                onUpdateBudget={handleUpdateBudget}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Upcoming Maintenance</h2>
                <Button onClick={() => setDialogMode({ type: 'maintenance' })}>
                  <Plus size={18} />
                  Schedule
                </Button>
              </div>
              {maintenanceLoading ? (
                <div className="text-center py-8">
                  <Spinner className="animate-spin mx-auto" size={32} />
                </div>
              ) : (
                <MaintenanceTimeline
                  events={maintenanceEvents.filter(e => e.status !== 'completed').slice(0, 3)}
                  onEventClick={(event) => setDialogMode({ type: 'maintenance', event })}
                  onAddExpense={(eventId) => setDialogMode({ type: 'expense', eventId })}
                  onMarkComplete={handleMarkComplete}
                  onDelete={handleDeleteMaintenanceEvent}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Maintenance Schedule</h2>
              <Button onClick={() => setDialogMode({ type: 'maintenance' })}>
                <Plus size={18} />
                Add Event
              </Button>
            </div>
            <MaintenanceCalendar
              events={maintenanceEvents}
              onEventClick={(event) => setDialogMode({ type: 'maintenance', event })}
            />
            {maintenanceLoading ? (
              <div className="text-center py-8">
                <Spinner className="animate-spin mx-auto" size={32} />
              </div>
            ) : (
              <MaintenanceTimeline
                events={maintenanceEvents}
                onEventClick={(event) => setDialogMode({ type: 'maintenance', event })}
                onAddExpense={(eventId) => setDialogMode({ type: 'expense', eventId })}
                onMarkComplete={handleMarkComplete}
                onDelete={handleDeleteMaintenanceEvent}
              />
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Expenses</h2>
              <Button onClick={() => setDialogMode({ type: 'expense' })}>
                <Plus size={18} />
                Add Expense
              </Button>
            </div>
            {expensesLoading ? (
              <div className="text-center py-8">
                <Spinner className="animate-spin mx-auto" size={32} />
              </div>
            ) : (
              <ExpenseHistory
                expenses={expenses}
                events={maintenanceEvents}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
              />
            )}
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recurring Reminders</h2>
              <Button onClick={() => setDialogMode({ type: 'reminder' })}>
                <Plus size={18} />
                Add Reminder
              </Button>
            </div>
            <RecurringReminderList
              reminders={reminders}
              onEdit={(reminder) => setDialogMode({ type: 'reminder', reminder })}
              onDelete={handleDeleteReminder}
              onToggleActive={handleToggleReminder}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={dialogMode.type !== 'none'} onOpenChange={() => setDialogMode({ type: 'none' })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {dialogMode.type === 'vehicle' && (
            <VehicleForm
              vehicle={dialogMode.vehicle}
              onSave={handleSaveVehicle}
              onCancel={() => setDialogMode({ type: 'none' })}
            />
          )}
          {dialogMode.type === 'maintenance' && vehicle && (
            <MaintenanceEventForm
              vehicleId={vehicle.id}
              event={dialogMode.event}
              onSave={handleSaveMaintenanceEvent}
              onCancel={() => setDialogMode({ type: 'none' })}
            />
          )}
          {dialogMode.type === 'expense' && vehicle && (
            <ExpenseForm
              eventId={dialogMode.eventId || ''}
              vehicleId={vehicle.id}
              expense={dialogMode.expense}
              onSave={handleSaveExpense}
              onCancel={() => setDialogMode({ type: 'none' })}
            />
          )}
          {dialogMode.type === 'reminder' && vehicle && (
            <RecurringReminderForm
              vehicleId={vehicle.id}
              reminder={dialogMode.reminder}
              onSave={handleSaveReminder}
              onCancel={() => setDialogMode({ type: 'none' })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App