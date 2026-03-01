import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MaintenanceEvent } from '@/lib/types'
import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { useState } from 'react'

interface MaintenanceCalendarProps {
  events: MaintenanceEvent[]
  onEventClick: (event: MaintenanceEvent) => void
  onDateClick?: (date: string) => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDateKey = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export const MaintenanceCalendar = ({
  events,
  onEventClick,
  onDateClick
}: MaintenanceCalendarProps) => {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const prevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1)
      setMonth(11)
      setSelectedDate(null)
      return
    }
    setMonth(m => m - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1)
      setMonth(0)
      setSelectedDate(null)
      return
    }
    setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  // Build a map of dateKey -> events
  const eventsByDate = new Map<string, MaintenanceEvent[]>()
  for (const event of events) {
    const dateStr = event.scheduledDate || event.completedDate
    if (!dateStr) continue
    const key = dateStr.slice(0, 10)
    const existing = eventsByDate.get(key) || []
    existing.push(event)
    eventsByDate.set(key, existing)
  }

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  const handleDayClick = (day: number) => {
    const key = toDateKey(year, month, day)
    setSelectedDate(key)
    onDateClick?.(key)
  }

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : []

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  // Build calendar grid cells (blanks + days)
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDayOfWeek + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <CalendarBlankIcon className='text-accent' size={24} />
            <CardTitle>Maintenance Calendar</CardTitle>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='icon' onClick={prevMonth} aria-label='Previous month'>
              <CaretLeftIcon size={18} />
            </Button>
            <span className='text-sm font-medium min-w-35 text-center'>{monthLabel}</span>
            <Button variant='ghost' size='icon' onClick={nextMonth} aria-label='Next month'>
              <CaretRightIcon size={18} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Day name headers */}
        <div className='grid grid-cols-7 gap-1'>
          {DAY_NAMES.map(name => (
            <div key={name} className='text-center text-xs text-muted-foreground font-medium py-1'>
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className='grid grid-cols-7 gap-1'>
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`blank-${idx}`} className='h-10' />
            }
            const key = toDateKey(year, month, day)
            const dayEvents = eventsByDate.get(key) || []
            const isToday = key === todayKey
            const isSelected = key === selectedDate
            const hasEvents = dayEvents.length > 0

            return (
              <button
                key={key}
                onClick={() => handleDayClick(day)}
                className={[
                  'h-10 rounded-md text-sm flex flex-col items-center justify-center relative transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted',
                  hasEvents && !isSelected ? 'font-semibold' : ''
                ].join(' ')}
              >
                {day}
                {hasEvents && (
                  <span
                    className={[
                      'absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                      isSelected ? 'bg-primary-foreground' : 'bg-accent'
                    ].join(' ')}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day events */}
        {selectedDate && (
          <div className='border-t border-border pt-4 space-y-2'>
            <p className='text-sm font-medium text-muted-foreground'>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {selectedEvents.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No events scheduled</p>
            ) : (
              <div className='space-y-2'>
                {selectedEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className='w-full text-left flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors'
                  >
                    <span className='text-sm font-medium truncate'>{event.title}</span>
                    <Badge
                      variant={event.status === 'completed' ? 'secondary' : 'outline'}
                      className='ml-2 shrink-0 text-xs'
                    >
                      {event.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
