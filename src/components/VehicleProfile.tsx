import { Vehicle } from '@/lib/types'
import { formatMileage } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Car, PencilSimple, Gauge } from '@phosphor-icons/react'

interface VehicleProfileProps {
  vehicle: Vehicle
  onEdit: () => void
}

export const VehicleProfile = ({ vehicle, onEdit }: VehicleProfileProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-accent" size={24} />
            <CardTitle>Vehicle Profile</CardTitle>
          </div>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <PencilSimple size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Mileage</p>
            <div className="flex items-center gap-2">
              <Gauge className="text-accent" size={18} />
              <p className="font-medium">{formatMileage(vehicle.currentOdometer)}</p>
            </div>
          </div>
          
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
                {new Date(vehicle.purchaseDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
