import { useState } from 'react'
import { Vehicle } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@phosphor-icons/react'

interface VehicleFormProps {
  vehicle?: Vehicle
  onSave: (vehicle: Vehicle) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

export const VehicleForm = ({ vehicle, onSave, onCancel, isSubmitting }: VehicleFormProps) => {
  const [formData, setFormData] = useState<Vehicle>(
    vehicle || {
      id: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      currentOdometer: 0,
      vin: '',
      licensePlate: '',
      purchaseDate: '',
      fuelType: '',
      engineType: ''
    }
  )
  const [shake, setShake] = useState(false)
  const [odometerError, setOdometerError] = useState(false)

  const minOdometer = vehicle ? vehicle.currentOdometer : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) {
      return
    }
    if (!formData.make || !formData.model || !formData.year) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    if (formData.currentOdometer < minOdometer) {
      setShake(true)
      setOdometerError(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    onSave(formData)
  }

  const handleChange = (field: keyof Vehicle, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'currentOdometer' && vehicle) {
      setOdometerError((value as number) < minOdometer)
    }
  }

  return (
    <div className="w-full">
      <div className="border-b border-border px-6 py-5 bg-card">
        <h2 className="text-2xl font-semibold">{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your vehicle details</p>
      </div>
      <div className="p-6">
        <form noValidate onSubmit={handleSubmit} className={`space-y-5 ${shake ? 'animate-shake' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleChange('make', e.target.value)}
                placeholder="Toyota"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="Camry"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentOdometer">Current Odometer (km) *</Label>
              <Input
                id="currentOdometer"
                type="number"
                value={formData.currentOdometer}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value)
                  handleChange('currentOdometer', Number.isFinite(parsed) ? parsed : 0)
                }}
                min={minOdometer}
                required
                className={odometerError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={odometerError}
                aria-describedby={odometerError ? 'odometer-error' : undefined}
              />
              {odometerError && (
                <p id="odometer-error" className="text-xs text-red-500">Odometer cannot go backwards</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleChange('vin', e.target.value)}
                placeholder="1HGBH41JXMN109186"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => handleChange('licensePlate', e.target.value)}
                placeholder="ABC-123"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleChange('purchaseDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select
                value={formData.fuelType}
                onValueChange={(value) => handleChange('fuelType', value)}
              >
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="plug-in-hybrid">Plug-in Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="engineType">Engine Type</Label>
              <Input
                id="engineType"
                value={formData.engineType}
                onChange={(e) => handleChange('engineType', e.target.value)}
                placeholder="2.5L I4"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2 border-t border-border">
            <Button type="submit" className="flex-1 h-11 transition-all duration-150" size="lg" disabled={isSubmitting || odometerError}>
              {isSubmitting ? (
                <>
                  <Spinner className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                vehicle ? 'Update Vehicle' : 'Add Vehicle'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel} size="lg" className="h-11 transition-all duration-150">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
