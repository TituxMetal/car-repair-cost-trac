import { RecurringReminder } from '@/lib/types'
import { maintenanceCategoryLabels } from '@/lib/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowsClockwise, Trash, PencilSimple, Clock, Gauge } from '@phosphor-icons/react'

interface RecurringReminderListProps {
  reminders: RecurringReminder[]
  onEdit: (reminder: RecurringReminder) => void
  onDelete: (reminderId: string) => void
  onToggleActive: (reminderId: string, isActive: boolean) => void
}

export const RecurringReminderList = ({ 
  reminders, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: RecurringReminderListProps) => {
  if (reminders.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center">
          <ArrowsClockwise className="mx-auto mb-3 text-muted-foreground" size={48} />
          <p className="text-muted-foreground">No recurring reminders set up yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create reminders to automatically track maintenance
          </p>
        </CardContent>
      </Card>
    )
  }

  const getRecurrenceDescription = (reminder: RecurringReminder): string => {
    const parts: string[] = []
    
    if (reminder.recurrenceType === 'time' || reminder.recurrenceType === 'both') {
      parts.push(`Every ${reminder.timeInterval} ${reminder.timeUnit}`)
    }
    
    if (reminder.recurrenceType === 'mileage' || reminder.recurrenceType === 'both') {
      parts.push(`Every ${reminder.mileageInterval?.toLocaleString()} km`)
    }
    
    return parts.join(' or ')
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <Card key={reminder.id} className={reminder.isActive ? '' : 'opacity-60'}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">{reminder.title}</h3>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {maintenanceCategoryLabels[reminder.category]}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  {(reminder.recurrenceType === 'time' || reminder.recurrenceType === 'both') && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Every {reminder.timeInterval} {reminder.timeUnit}</span>
                    </div>
                  )}
                  {(reminder.recurrenceType === 'mileage' || reminder.recurrenceType === 'both') && (
                    <div className="flex items-center gap-1">
                      <Gauge size={14} />
                      <span>Every {reminder.mileageInterval?.toLocaleString()} km</span>
                    </div>
                  )}
                </div>
                
                {reminder.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {reminder.description}
                  </p>
                )}
                
                {reminder.lastCompletedDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last completed: {new Date(reminder.lastCompletedDate).toLocaleDateString()}
                    {reminder.lastCompletedMileage && ` at ${reminder.lastCompletedMileage.toLocaleString()} km`}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={reminder.isActive}
                  onCheckedChange={(checked) => onToggleActive(reminder.id, checked)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(reminder)}
                >
                  <PencilSimple size={18} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(reminder.id)}
                >
                  <Trash size={18} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
