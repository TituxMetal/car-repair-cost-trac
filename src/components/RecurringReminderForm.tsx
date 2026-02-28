import { useState } from 'react'
import { RecurringReminder, MaintenanceCategory, RecurrenceType } from '@/lib/types'
import { maintenanceCategoryLabels } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type ReminderFormData = Omit<RecurringReminder, 'id'> & { id?: string }

interface RecurringReminderFormProps {
  vehicleId: string
  reminder?: RecurringReminder
  onSave: (reminder: ReminderFormData) => void
  onCancel?: () => void
}

export const RecurringReminderForm = ({ vehicleId, reminder, onSave, onCancel }: RecurringReminderFormProps) => {
  const [formData, setFormData] = useState<ReminderFormData>(
    reminder || {
      vehicleId,
      category: 'oil-change',
      title: '',
      description: '',
      recurrenceType: 'time',
      timeInterval: 3,
      timeUnit: 'months',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.category) {
      if (formData.recurrenceType === 'mileage' && !formData.mileageInterval) return
      if (formData.recurrenceType === 'time' && (!formData.timeInterval || !formData.timeUnit)) return
      if (formData.recurrenceType === 'both' && (!formData.mileageInterval || !formData.timeInterval || !formData.timeUnit)) return
      
      onSave(formData)
    }
  }

  const handleChange = (field: keyof ReminderFormData, value: ReminderFormData[keyof ReminderFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{reminder ? 'Edit Recurring Reminder' : 'Create Recurring Reminder'}</CardTitle>
        <CardDescription>Set up automatic maintenance reminders</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">Title *</Label>
            <Input
              id="reminder-title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Oil Change Reminder"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reminder-category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value as MaintenanceCategory)}
            >
              <SelectTrigger id="reminder-category">
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
            <Label htmlFor="reminder-description">Description</Label>
            <Textarea
              id="reminder-description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional details about this reminder..."
              rows={3}
            />
          </div>
          
          <div className="space-y-3 border-t border-border pt-4">
            <Label>Recurrence Type *</Label>
            <RadioGroup
              value={formData.recurrenceType}
              onValueChange={(value) => handleChange('recurrenceType', value as RecurrenceType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="time" id="type-time" />
                <Label htmlFor="type-time" className="font-normal cursor-pointer">
                  Time-based (e.g., every 3 months)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mileage" id="type-mileage" />
                <Label htmlFor="type-mileage" className="font-normal cursor-pointer">
                  Mileage-based (e.g., every 5,000 km)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="type-both" />
                <Label htmlFor="type-both" className="font-normal cursor-pointer">
                  Both (whichever comes first)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {(formData.recurrenceType === 'time' || formData.recurrenceType === 'both') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time-interval">Time Interval *</Label>
                <Input
                  id="time-interval"
                  type="number"
                  value={formData.timeInterval || ''}
                  onChange={(e) => handleChange('timeInterval', parseInt(e.target.value))}
                  min="1"
                  placeholder="3"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-unit">Unit *</Label>
                <Select
                  value={formData.timeUnit}
                  onValueChange={(value) => handleChange('timeUnit', value)}
                >
                  <SelectTrigger id="time-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {(formData.recurrenceType === 'mileage' || formData.recurrenceType === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="mileage-interval">Mileage Interval (km) *</Label>
              <Input
                id="mileage-interval"
                type="number"
                value={formData.mileageInterval || ''}
                onChange={(e) => handleChange('mileageInterval', parseInt(e.target.value))}
                min="1"
                placeholder="5000"
                required
              />
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {reminder ? 'Update Reminder' : 'Create Reminder'}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
