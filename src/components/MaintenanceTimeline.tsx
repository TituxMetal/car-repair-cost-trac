import { MaintenanceEvent } from '@/lib/types'
import { formatDate, formatMileage, maintenanceCategoryLabels, isOverdue } from '@/lib/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wrench, Calendar, Gauge, MapPin, Clock, Check, Warning, Plus, Trash } from '@phosphor-icons/react'

interface MaintenanceTimelineProps {
  events: MaintenanceEvent[]
  onEventClick: (event: MaintenanceEvent) => void
  onAddExpense: (eventId: string) => void
  onMarkComplete: (eventId: string) => void
  onDelete: (eventId: string) => void
}

export const MaintenanceTimeline = ({ events, onEventClick, onAddExpense, onMarkComplete, onDelete }: MaintenanceTimelineProps) => {
  const upcomingEvents = events.filter(e => e.status === 'scheduled' && !isOverdue(e.scheduledDate, e.status))
  const overdueEvents = events.filter(e => isOverdue(e.scheduledDate, e.status))
  const completedEvents = events.filter(e => e.status === 'completed')

  const EventCard = ({ event }: { event: MaintenanceEvent }) => {
    const overdue = isOverdue(event.scheduledDate, event.status)
    
    return (
      <Card 
        className={`hover:bg-card/80 transition-colors cursor-pointer ${
          overdue ? 'border-destructive/50' : ''
        }`}
        onClick={() => onEventClick(event)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Wrench className="text-accent flex-shrink-0" size={18} />
                <h4 className="font-medium">{event.title}</h4>
                <Badge variant={event.status === 'completed' ? 'secondary' : 'default'}>
                  {maintenanceCategoryLabels[event.category]}
                </Badge>
                {overdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Warning size={14} />
                    Overdue
                  </Badge>
                )}
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
              )}
              
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {event.scheduledDate && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(event.scheduledDate)}
                  </div>
                )}
                {event.scheduledMileage && (
                  <div className="flex items-center gap-1">
                    <Gauge size={14} />
                    {formatMileage(event.scheduledMileage)}
                  </div>
                )}
                {event.appointmentPlace && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {event.appointmentPlace}
                  </div>
                )}
                {event.appointmentTime && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {event.appointmentTime}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {event.status !== 'completed' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkComplete(event.id)
                    }}
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddExpense(event.id)
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('Are you sure you want to delete this maintenance event?')) {
                    onDelete(event.id)
                  }
                }}
              >
                <Trash size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {overdueEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Warning className="text-destructive" size={20} />
            <h3 className="text-lg font-semibold">Overdue ({overdueEvents.length})</h3>
          </div>
          <div className="space-y-2">
            {overdueEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
      
      {upcomingEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-accent" size={20} />
            <h3 className="text-lg font-semibold">Upcoming ({upcomingEvents.length})</h3>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
      
      {completedEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Completed ({completedEvents.length})</h3>
          </div>
          <div className="space-y-2">
            {completedEvents.slice(0, 5).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {completedEvents.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              And {completedEvents.length - 5} more completed events
            </p>
          )}
        </div>
      )}
      
      {events.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="text-muted-foreground mx-auto mb-4" size={48} />
          <h3 className="text-lg font-medium mb-2">No maintenance events yet</h3>
          <p className="text-muted-foreground">Schedule your first maintenance to get started</p>
        </div>
      )}
    </div>
  )
}
