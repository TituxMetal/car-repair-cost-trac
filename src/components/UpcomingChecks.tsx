import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceApi } from '@/lib/api'
import { MaintenanceEvent } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/helpers'
import { toast } from 'sonner'
import { useState } from 'react'

interface UpcomingChecksProps {
  vehicleId: string
}

const categoryIcons: Record<string, string> = {
  'oil-level-check': '🛢️',
  'tire-pressure-check': '🛞',
  'brake-fluid-check': '🛑',
  'coolant-level-check': '🧊',
  'windshield-washer-check': '💧',
  'lights-check': '💡',
}

export function UpcomingChecks({ vehicleId }: UpcomingChecksProps) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(true)
  
  const { data: upcomingChecks = [], isLoading, refetch } = useQuery({
    queryKey: ['maintenance', 'upcoming', vehicleId],
    queryFn: () => maintenanceApi.getUpcoming(vehicleId),
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, mileage }: { id: string; mileage?: number }) =>
      maintenanceApi.markComplete(id, mileage),
    onSuccess: (data) => {
      // Force refetch all maintenance data
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      refetch()
      if (data.next) {
        toast.success(`✅ Done! Next check scheduled for ${formatDate(data.next.scheduledDate!)}`)
      } else {
        toast.success('✅ Check completed!')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete check')
    },
  })

  const handleComplete = (event: MaintenanceEvent) => {
    completeMutation.mutate({ id: event.id })
  }

  const isOverdue = (event: MaintenanceEvent) => {
    if (!event.scheduledDate) return false
    const today = new Date().toISOString().split('T')[0]
    return event.scheduledDate < today
  }

  const _isDueToday = (event: MaintenanceEvent) => {
    if (!event.scheduledDate) return false
    const today = new Date().toISOString().split('T')[0]
    return event.scheduledDate === today
  }

  const isDueThisWeek = (event: MaintenanceEvent) => {
    if (!event.scheduledDate) return false
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return event.scheduledDate <= nextWeek.toISOString().split('T')[0]
  }

  // Only show checks due this week (not future ones)
  const dueThisWeek = upcomingChecks.filter(isDueThisWeek)

  if (isLoading) {
    return (
      <Card className="border-2 rounded-md">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            Loading checks...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (dueThisWeek.length === 0) {
    return (
      <Card className="border-2 rounded-md bg-green-500/10 border-green-500/30">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            All Checks Complete for This Week!
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 rounded-md">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Weekly Checks
                <Badge variant="secondary" className="ml-2">
                  {dueThisWeek.length} due
                </Badge>
              </CardTitle>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {dueThisWeek.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-2 rounded-md border ${
                    isOverdue(event)
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">
                      {categoryIcons[event.category] || '🔧'}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {event.title.replace('Weekly ', '')}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleComplete(event)}
                    disabled={completeMutation.isPending}
                    className="h-7 px-2 flex-shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
