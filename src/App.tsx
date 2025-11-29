import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Vehicle, MaintenanceEvent, Expense, Budget, RecurringReminder } from '@/lib/types'
import { generateId, createDefaultWeeklyChecks } from '@/lib/helpers'
import { useRecurringReminders, updateReminderAfterCompletion } from '@/hooks/use-recurring-reminders'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VehicleForm } from '@/components/VehicleForm'
import { VehicleProfile } from '@/components/VehicleProfile'
import { MaintenanceEventForm } from '@/components/MaintenanceEventForm'
import { MaintenanceTimeline } from '@/components/MaintenanceTimeline'
import { ExpenseForm } from '@/components/ExpenseForm'
import { ExpenseHistory } from '@/components/ExpenseHistory'
import { BudgetOverview } from '@/components/BudgetOverview'
import { RecurringReminderForm } from '@/components/RecurringReminderForm'
import { RecurringReminderList } from '@/components/RecurringReminderList'
import { Plus, Car, Wrench, CurrencyDollar, ArrowsClockwise } from '@phosphor-icons/react'

type DialogMode = 
  | { type: 'none' }
  | { type: 'vehicle'; vehicle?: Vehicle }
  | { type: 'maintenance'; event?: MaintenanceEvent }
  | { type: 'expense'; eventId?: string; expense?: Expense }
  | { type: 'reminder'; reminder?: RecurringReminder }

function App() {
  const [vehicle, setVehicle] = useKV<Vehicle | null>('vehicle', null)
  const [maintenanceEvents, setMaintenanceEvents] = useKV<MaintenanceEvent[]>('maintenance-events', [])
  const [expenses, setExpenses] = useKV<Expense[]>('expenses', [])
  const [budget, setBudget] = useKV<Budget | null>('budget', null)
  const [reminders, setReminders] = useKV<RecurringReminder[]>('recurring-reminders', [])
  const [dialogMode, setDialogMode] = useState<DialogMode>({ type: 'none' })

  useRecurringReminders(reminders || [], maintenanceEvents || [], vehicle || null, setMaintenanceEvents)

  const handleSaveVehicle = (updatedVehicle: Vehicle) => {
    const isNewVehicle = !vehicle
    setVehicle(updatedVehicle)
    
    // Create default weekly checks for new vehicles
    if (isNewVehicle) {
      const weeklyChecks = createDefaultWeeklyChecks(updatedVehicle.id)
      setMaintenanceEvents(current => [...(current || []), ...weeklyChecks])
      toast.success('Vehicle saved with weekly maintenance checks')
    } else {
      toast.success('Vehicle saved successfully')
    }
    
    setDialogMode({ type: 'none' })
  }

  const handleSaveMaintenanceEvent = (event: MaintenanceEvent) => {
    setMaintenanceEvents(current => {
      const currentEvents = current || []
      const existing = currentEvents.find(e => e.id === event.id)
      if (existing) {
        return currentEvents.map(e => e.id === event.id ? event : e)
      }
      return [...currentEvents, event]
    })
    setDialogMode({ type: 'none' })
    toast.success('Maintenance event saved')
  }

  const handleSaveExpense = (expense: Expense) => {
    setExpenses(current => {
      const currentExpenses = current || []
      const existing = currentExpenses.find(e => e.id === expense.id)
      if (existing) {
        return currentExpenses.map(e => e.id === expense.id ? expense : e)
      }
      return [...currentExpenses, expense]
    })
    setDialogMode({ type: 'none' })
    toast.success('Expense recorded')
  }

  const handleMarkComplete = (eventId: string) => {
    setMaintenanceEvents(current => {
      const currentEvents = current || []
      const event = currentEvents.find(e => e.id === eventId)
      
      if (event && reminders) {
        const relatedReminder = reminders.find(r => 
          r.category === event.category && r.isActive
        )
        
        if (relatedReminder) {
          const completedDate = new Date().toISOString().split('T')[0]
          const completedMileage = vehicle?.currentOdometer
          
          setReminders(currentReminders => {
            const updated = currentReminders || []
            return updated.map(r => 
              r.id === relatedReminder.id 
                ? updateReminderAfterCompletion(r, completedDate, completedMileage)
                : r
            )
          })
        }
      }
      
      return currentEvents.map(e =>
        e.id === eventId
          ? {
              ...e,
              status: 'completed' as const,
              completedDate: new Date().toISOString().split('T')[0],
              completedMileage: vehicle?.currentOdometer
            }
          : e
      )
    })
    toast.success('Maintenance marked as complete')
  }

  const handleUpdateBudget = (updatedBudget: Budget) => {
    setBudget({
      ...updatedBudget,
      vehicleId: vehicle?.id || ''
    })
    toast.success('Budget updated')
  }

  const handleSaveReminder = (reminder: RecurringReminder) => {
    setReminders(current => {
      const currentReminders = current || []
      const existing = currentReminders.find(r => r.id === reminder.id)
      if (existing) {
        return currentReminders.map(r => r.id === reminder.id ? reminder : r)
      }
      return [...currentReminders, reminder]
    })
    setDialogMode({ type: 'none' })
    toast.success('Recurring reminder saved')
  }

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(current => {
      const currentReminders = current || []
      return currentReminders.filter(r => r.id !== reminderId)
    })
    toast.success('Reminder deleted')
  }

  const handleToggleReminderActive = (reminderId: string, isActive: boolean) => {
    setReminders(current => {
      const currentReminders = current || []
      return currentReminders.map(r =>
        r.id === reminderId ? { ...r, isActive } : r
      )
    })
    toast.success(isActive ? 'Reminder activated' : 'Reminder deactivated')
  }

  const totalSpending = (expenses || []).reduce((sum, exp) => sum + exp.totalCost, 0)

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <Toaster position="top-center" />
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Car className="text-accent mx-auto mb-4" size={64} />
            <h1 className="text-3xl font-semibold mb-2">Car Maintenance Tracker</h1>
            <p className="text-muted-foreground">
              Start by adding your vehicle to track maintenance and costs
            </p>
          </div>
          <VehicleForm onSave={handleSaveVehicle} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" />
      
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="text-accent" size={32} />
              <div>
                <h1 className="text-xl font-semibold">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-xs text-muted-foreground">Maintenance Tracker</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VehicleProfile
                vehicle={vehicle}
                onEdit={() => setDialogMode({ type: 'vehicle', vehicle })}
              />
              <BudgetOverview
                budget={budget || undefined}
                actualSpending={totalSpending}
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
              <MaintenanceTimeline
                events={(maintenanceEvents || []).filter(e => e.status !== 'completed').slice(0, 3)}
                onEventClick={(event) => setDialogMode({ type: 'maintenance', event })}
                onAddExpense={(eventId) => setDialogMode({ type: 'expense', eventId })}
                onMarkComplete={handleMarkComplete}
              />
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
            <MaintenanceTimeline
              events={maintenanceEvents || []}
              onEventClick={(event) => setDialogMode({ type: 'maintenance', event })}
              onAddExpense={(eventId) => setDialogMode({ type: 'expense', eventId })}
              onMarkComplete={handleMarkComplete}
            />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recurring Reminders</h2>
                <p className="text-sm text-muted-foreground">
                  Automatically schedule maintenance based on time or mileage
                </p>
              </div>
              <Button onClick={() => setDialogMode({ type: 'reminder' })}>
                <Plus size={18} />
                Add Reminder
              </Button>
            </div>
            <RecurringReminderList
              reminders={reminders || []}
              onEdit={(reminder) => setDialogMode({ type: 'reminder', reminder })}
              onDelete={handleDeleteReminder}
              onToggleActive={handleToggleReminderActive}
            />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Expenses</h2>
              <Button onClick={() => setDialogMode({ type: 'expense' })}>
                <Plus size={18} />
                Add Expense
              </Button>
            </div>
            <ExpenseHistory expenses={expenses || []} events={maintenanceEvents || []} />
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