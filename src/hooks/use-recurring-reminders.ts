import { useEffect } from 'react'
import { RecurringReminder, MaintenanceEvent, Vehicle } from '@/lib/types'
import { generateId, calculateNextDueDate, calculateNextDueMileage } from '@/lib/helpers'

/**
 * @deprecated This hook uses client-side event generation which is now handled by the backend
 * via the /api/reminders/:vehicleId/generate-events endpoint. Integration will be completed
 * when the remindersApi from @/lib/api is available. Use the backend API directly instead.
 */
export const useRecurringReminders = (
  reminders: RecurringReminder[],
  maintenanceEvents: MaintenanceEvent[],
  vehicle: Vehicle | null,
  setMaintenanceEvents: (updater: (current: MaintenanceEvent[]) => MaintenanceEvent[]) => void
) => {
  useEffect(() => {
    if (!vehicle || !reminders || reminders.length === 0) return

    const activeReminders = reminders.filter(r => r.isActive)
    if (activeReminders.length === 0) return

    const generateEventsForReminders = () => {
      const newEvents: MaintenanceEvent[] = []
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      activeReminders.forEach(reminder => {
        const existingEvents = maintenanceEvents.filter(
          e => e.category === reminder.category && e.status !== 'completed'
        )

        const shouldGenerateEvent = existingEvents.length === 0

        if (!shouldGenerateEvent) return

        let scheduledDate: string | undefined
        let scheduledMileage: number | undefined

        if (reminder.recurrenceType === 'time' && reminder.timeInterval && reminder.timeUnit) {
          scheduledDate = calculateNextDueDate(
            reminder.lastCompletedDate,
            reminder.timeInterval,
            reminder.timeUnit
          )
        }

        if (reminder.recurrenceType === 'mileage' && reminder.mileageInterval) {
          scheduledMileage = calculateNextDueMileage(
            reminder.lastCompletedMileage,
            vehicle.currentOdometer,
            reminder.mileageInterval
          )
        }

        if (reminder.recurrenceType === 'both') {
          if (reminder.timeInterval && reminder.timeUnit) {
            scheduledDate = calculateNextDueDate(
              reminder.lastCompletedDate,
              reminder.timeInterval,
              reminder.timeUnit
            )
          }
          if (reminder.mileageInterval) {
            scheduledMileage = calculateNextDueMileage(
              reminder.lastCompletedMileage,
              vehicle.currentOdometer,
              reminder.mileageInterval
            )
          }
        }

        if (!scheduledDate && !scheduledMileage) {
          scheduledDate = today
        }

        const newEvent: MaintenanceEvent = {
          id: generateId(),
          vehicleId: vehicle.id,
          category: reminder.category,
          type: 'service',
          title: reminder.title,
          description: reminder.description,
          scheduledDate,
          scheduledMileage,
          status: 'scheduled',
          createdAt: now.toISOString()
        }

        newEvents.push(newEvent)
      })

      if (newEvents.length > 0) {
        setMaintenanceEvents((current) => [...current, ...newEvents])
      }
    }

    generateEventsForReminders()
  }, [reminders, maintenanceEvents, vehicle, setMaintenanceEvents])
}

export const updateReminderAfterCompletion = (
  reminder: RecurringReminder,
  completedDate: string,
  completedMileage?: number
): RecurringReminder => {
  return {
    ...reminder,
    lastCompletedDate: completedDate,
    lastCompletedMileage: completedMileage
  }
}
