import { useState } from 'react'
import { Vehicle } from '@/lib/types'
import { formatMileage } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Car, PencilSimple, Gauge, CaretDown, CaretUp } from '@phosphor-icons/react'

interface VehicleProfileProps {
  vehicle: Vehicle
  onEdit: () => void
}

export const VehicleProfile = ({ vehicle, onEdit }: VehicleProfileProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false)

  const formatPurchaseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString()
  }

  const detailsGrid = (
    <div className="grid grid-cols-2 gap-4">
      {vehicle.fuelType && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Fuel Type</p>
          <p className="font-medium capitalize">{vehicle.fuelType}</p>
        </div>
      )}

      {vehicle.engineType && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Engine</p>
          <p className="font-medium">{vehicle.engineType}</p>
        </div>
      )}

      {vehicle.vin && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">VIN</p>
          <p className="font-medium text-xs">{vehicle.vin}</p>
        </div>
      )}

      {vehicle.purchaseDate && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Purchased</p>
          <p className="font-medium">
            {formatPurchaseDate(vehicle.purchaseDate)}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-accent" size={24} />
            <CardTitle>Vehicle Profile</CardTitle>
          </div>
          <Button variant="secondary" size="sm" onClick={onEdit} className="h-11 w-11 min-h-11 transition-all duration-150" aria-label="Edit vehicle" title="Edit vehicle">
            <PencilSimple size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-2xl font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            {vehicle.licensePlate && (
              <Badge variant="secondary" className="mt-2">
                {vehicle.licensePlate}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Gauge className="text-accent" size={18} />
            <p className="font-medium">{formatMileage(vehicle.currentOdometer)}</p>
          </div>
        </div>

        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={detailsOpen ? 'Collapse vehicle details' : 'Expand vehicle details'} className="w-full flex items-center justify-between h-11 min-h-11 transition-all duration-150 md:hidden">
              <span className="text-sm text-muted-foreground">Details</span>
              {detailsOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="md:hidden pt-2">
            {detailsGrid}
          </CollapsibleContent>

          <div className="hidden md:block">
            {detailsGrid}
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
