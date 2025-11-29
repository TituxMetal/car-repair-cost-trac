import { useState } from 'react'
import { MaintenanceEvent, MaintenanceCategory, MaintenanceType } from '@/lib/types'
import { generateId, maintenanceCategoryLabels } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MaintenanceEventFormProps {
  vehicleId: string
  event?: MaintenanceEvent
  onSave: (event: MaintenanceEvent) => void
  onCancel?: () => void
}

export const MaintenanceEventForm = ({ vehicleId, event, onSave, onCancel }: MaintenanceEventFormProps) => {
  const [formData, setFormData] = useState<MaintenanceEvent>(
    event || {
      id: generateId(),
      vehicleId,
      category: 'oil-change',
      type: 'service',
      title: '',
      description: '',
      scheduledDate: '',
      scheduledMileage: undefined,
      completedDate: '',
      completedMileage: undefined,
      status: 'scheduled',
      appointmentTime: '',
      appointmentPlace: '',
      appointmentReason: '',
      createdAt: new Date().toISOString()
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.category) {
      onSave(formData)
    }
  }

  const handleChange = (field: keyof MaintenanceEvent, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="w-full">
      <div className="border-b border-border px-6 py-5 bg-card">
        <h2 className="text-2xl font-semibold">{event ? 'Edit Maintenance' : 'Schedule Maintenance'}</h2>
        <p className="text-sm text-muted-foreground mt-1">Plan your vehicle maintenance</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Oil Change Service"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value as MaintenanceCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(maintenanceCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value as MaintenanceType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="part-replacement">Part Replacement</SelectItem>
                  <SelectItem value="mileage-check">Mileage Check</SelectItem>
                  <SelectItem value="date-check">Date Check</SelectItem>
                  <SelectItem value="weekly-check">Weekly Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scheduledMileage">Scheduled Mileage (km)</Label>
              <Input
                id="scheduledMileage"
                type="number"
                value={formData.scheduledMileage || ''}
                onChange={(e) => handleChange('scheduledMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
              />
            </div>
          </div>
          
          <div className="border-t border-border pt-5 space-y-4">
            <h4 className="text-sm font-semibold">Appointment Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentPlace">Location</Label>
                <Input
                  id="appointmentPlace"
                  value={formData.appointmentPlace}
                  onChange={(e) => handleChange('appointmentPlace', e.target.value)}
                  placeholder="Auto Shop Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentTime">Time</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => handleChange('appointmentTime', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentReason">Reason</Label>
              <Input
                id="appointmentReason"
                value={formData.appointmentReason}
                onChange={(e) => handleChange('appointmentReason', e.target.value)}
                placeholder="Routine maintenance"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2 border-t border-border">
            <Button type="submit" className="flex-1" size="lg">
              {event ? 'Update Event' : 'Schedule Event'}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel} size="lg">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
