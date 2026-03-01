import { useState } from 'react'
import { Expense } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@phosphor-icons/react'

interface ExpenseFormProps {
  eventId: string
  vehicleId: string
  expense?: Expense
  onSave: (expense: Expense) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

export const ExpenseForm = ({ eventId, vehicleId, expense, onSave, onCancel, isSubmitting }: ExpenseFormProps) => {
  const [formData, setFormData] = useState<Expense>(
    expense || {
      id: '',
      eventId,
      vehicleId,
      date: new Date().toISOString().split('T')[0],
      garageName: '',
      description: '',
      partsCost: 0,
      laborCost: 0,
      otherCost: 0,
      totalCost: 0
    }
  )
  const [shake, setShake] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) {
      return
    }
    if (!formData.date) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    if (formData.partsCost < 0 || formData.laborCost < 0 || formData.otherCost < 0) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    const total = formData.partsCost + formData.laborCost + formData.otherCost
    onSave({ ...formData, totalCost: total })
  }

  const handleChange = (field: keyof Expense, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const totalCost = formData.partsCost + formData.laborCost + formData.otherCost

  return (
    <div className="w-full">
      <div className="border-b border-border px-6 py-5 bg-card">
        <h2 className="text-2xl font-semibold">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
        <p className="text-sm text-muted-foreground mt-1">Track your maintenance costs</p>
      </div>
      <div className="p-6">
        <form noValidate onSubmit={handleSubmit} className={`space-y-5 ${shake ? 'animate-shake' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="garageName">Garage Name</Label>
              <Input
                id="garageName"
                value={formData.garageName}
                onChange={(e) => handleChange('garageName', e.target.value)}
                placeholder="Auto Repair Shop"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Details of work performed..."
              rows={3}
            />
          </div>
          
          <div className="border-t border-border pt-5 space-y-4">
            <h4 className="text-sm font-semibold">Cost Breakdown</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partsCost">Parts Cost (€)</Label>
                <Input
                  id="partsCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.partsCost}
                  onChange={(e) => handleChange('partsCost', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="laborCost">Labor Cost (€)</Label>
                <Input
                  id="laborCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.laborCost}
                  onChange={(e) => handleChange('laborCost', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherCost">Other Cost (€)</Label>
                <Input
                  id="otherCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.otherCost}
                  onChange={(e) => handleChange('otherCost', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="bg-accent/10 border border-accent/30 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Total Cost</span>
                <span className="text-2xl font-bold text-accent">
                  €{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2 border-t border-border">
            <Button type="submit" className="flex-1 h-11 transition-all duration-150" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                expense ? 'Update Expense' : 'Add Expense'
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
