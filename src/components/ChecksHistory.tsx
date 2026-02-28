import { useQuery } from '@tanstack/react-query'
import { maintenanceApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from '@phosphor-icons/react'

interface ChecksHistoryProps {
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

const categoryLabels: Record<string, string> = {
  'oil-level-check': 'Oil',
  'tire-pressure-check': 'Tires',
  'brake-fluid-check': 'Brakes',
  'coolant-level-check': 'Coolant',
  'windshield-washer-check': 'Washer',
  'lights-check': 'Lights',
}

// Get week number from date
function _getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr)
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

// Format relative time
function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  
  const weeks = Math.floor(diffDays / 7)
  return `${weeks}w ago`
}

export function ChecksHistory({ vehicleId }: ChecksHistoryProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['maintenance', 'history', vehicleId],
    queryFn: () => maintenanceApi.getHistory(vehicleId),
  })

  // Get only the LAST completion for each category
  const lastCheckByCategory = history.reduce((acc, check) => {
    if (!acc[check.category] || (check.completedDate && check.completedDate > (acc[check.category].completedDate || ''))) {
      acc[check.category] = check
    }
    return acc
  }, {} as Record<string, typeof history[0]>)

  const lastChecks = Object.values(lastCheckByCategory)

  if (isLoading || lastChecks.length === 0) {
    return (
      <Card className="border-2 rounded-md">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5" />
            Last Checked
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : 'Complete a check to see history'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 rounded-md">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Last Checked
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {lastChecks.map((check) => (
            <div
              key={check.category}
              className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm"
            >
              <span>{categoryIcons[check.category] || '🔧'}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-xs">
                  {categoryLabels[check.category] || check.category}
                </div>
                <div className="text-xs text-green-500">
                  {check.completedDate ? formatRelative(check.completedDate) : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
