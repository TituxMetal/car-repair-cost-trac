import { RecurringReminder, Vehicle } from '@/lib/types'
import { maintenanceCategoryLabels } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowsClockwise, Clock, Gauge, Plus } from '@phosphor-icons/react'

interface UpcomingRemindersProps {
  reminders: RecurringReminder[]
  vehicle: Vehicle
  onAddReminder: () => void
}

interface ReminderStatus {
  reminder: RecurringReminder
  daysSinceLast?: number
  mileageSinceLast?: number
  isDueSoon: boolean
}

export const UpcomingReminders = ({ reminders, vehicle, onAddReminder }: UpcomingRemindersProps) => {
  const activeReminders = reminders.filter(r => r.isActive)

  const getReminderStatuses = (): ReminderStatus[] => {
    const now = new Date()
    
    return activeReminders.map(reminder => {
      let daysSinceLast: number | undefined
      let mileageSinceLast: number | undefined
      let isDueSoon = false

      if (reminder.recurrenceType === 'time' || reminder.recurrenceType === 'both') {
        if (reminder.lastCompletedDate && reminder.timeInterval && reminder.timeUnit) {
          const lastDate = new Date(reminder.lastCompletedDate)
          const diffTime = now.getTime() - lastDate.getTime()
          daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          let intervalInDays = reminder.timeInterval
          if (reminder.timeUnit === 'weeks') intervalInDays *= 7
          if (reminder.timeUnit === 'months') intervalInDays *= 30
          if (reminder.timeUnit === 'years') intervalInDays *= 365

          if (daysSinceLast >= intervalInDays * 0.8) {
            isDueSoon = true
          }
        } else if (!reminder.lastCompletedDate) {
          isDueSoon = true
        }
      }

      if (reminder.recurrenceType === 'mileage' || reminder.recurrenceType === 'both') {
        if (reminder.mileageInterval) {
          const lastMileage = reminder.lastCompletedMileage || 0
          mileageSinceLast = vehicle.currentOdometer - lastMileage

          if (mileageSinceLast >= reminder.mileageInterval * 0.8) {
            isDueSoon = true
          }
        }
      }

      return {
        reminder,
        daysSinceLast,
        mileageSinceLast,
        isDueSoon
      }
    })
  }

  const statuses = getReminderStatuses()
  const dueSoonStatuses = statuses.filter(s => s.isDueSoon).slice(0, 3)

  if (activeReminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowsClockwise size={20} />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <ArrowsClockwise className="mx-auto mb-3 text-muted-foreground" size={40} />
            <p className="text-sm text-muted-foreground mb-3">No recurring reminders set up</p>
            <Button size="sm" onClick={onAddReminder}>
              <Plus size={16} />
              Create Reminder
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (dueSoonStatuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowsClockwise size={20} />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">All maintenance is up to date!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowsClockwise size={20} />
          Upcoming Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dueSoonStatuses.map(({ reminder, daysSinceLast, mileageSinceLast }) => (
          <div key={reminder.id} className="border border-border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm">{reminder.title}</h4>
              <Badge variant="secondary" className="text-xs shrink-0">
                {maintenanceCategoryLabels[reminder.category]}
              </Badge>
            </div>

            <div className="space-y-1.5">
              {daysSinceLast !== undefined && reminder.timeInterval && reminder.timeUnit && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={14} />
                    <span>Time-based</span>
                  </div>
                  <span className={daysSinceLast >= (reminder.timeInterval * (reminder.timeUnit === 'days' ? 1 : reminder.timeUnit === 'weeks' ? 7 : reminder.timeUnit === 'months' ? 30 : 365)) ? 'text-destructive font-medium' : 'text-foreground'}>
                    {daysSinceLast} / {reminder.timeInterval * (reminder.timeUnit === 'days' ? 1 : reminder.timeUnit === 'weeks' ? 7 : reminder.timeUnit === 'months' ? 30 : 365)} days
                  </span>
                </div>
              )}

              {mileageSinceLast !== undefined && reminder.mileageInterval && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Gauge size={14} />
                    <span>Mileage-based</span>
                  </div>
                  <span className={mileageSinceLast >= reminder.mileageInterval ? 'text-destructive font-medium' : 'text-foreground'}>
                    {mileageSinceLast.toLocaleString()} / {reminder.mileageInterval.toLocaleString()} km
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
