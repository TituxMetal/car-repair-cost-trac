import { useState } from 'react'
import { Budget } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyDollar, PencilSimple, Warning } from '@phosphor-icons/react'

interface BudgetOverviewProps {
  budget?: Budget
  actualSpending: number
  onUpdateBudget: (budget: Budget) => void
}

export const BudgetOverview = ({ budget, actualSpending, onUpdateBudget }: BudgetOverviewProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [amount, setAmount] = useState(budget?.amount || 1000)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(budget?.period || 'yearly')

  const handleSave = () => {
    onUpdateBudget({
      id: budget?.id || `budget-${Date.now()}`,
      vehicleId: budget?.vehicleId || '',
      amount,
      period,
      startDate: budget?.startDate || new Date().toISOString()
    })
    setIsEditDialogOpen(false)
  }

  const budgetAmount = budget?.amount || 0
  const percentage = budgetAmount > 0 ? Math.min((actualSpending / budgetAmount) * 100, 100) : 0
  const remaining = budgetAmount - actualSpending
  const isOverBudget = actualSpending > budgetAmount

  const _getProgressColor = () => {
    if (percentage >= 100) return 'bg-destructive'
    if (percentage >= 80) return 'bg-accent'
    return 'bg-primary'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollar className="text-accent" size={24} />
            <CardTitle>Budget Overview</CardTitle>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <PencilSimple size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Budget</DialogTitle>
                <DialogDescription>Define your maintenance budget</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="budget-amount">Budget Amount (€)</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="10"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-period">Period</Label>
                  <Select value={period} onValueChange={(value) => setPeriod(value as 'monthly' | 'yearly')}>
                    <SelectTrigger id="budget-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          {budget ? `${period === 'yearly' ? 'Annual' : 'Monthly'} maintenance budget` : 'No budget set'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {budget ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">{formatCurrency(actualSpending)}</span>
              </div>
              <Progress value={percentage} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">{formatCurrency(budgetAmount)}</span>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isOverBudget ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOverBudget && <Warning className="text-destructive" size={20} />}
                  <span className="text-sm font-medium">
                    {isOverBudget ? 'Over Budget' : 'Remaining'}
                  </span>
                </div>
                <span className={`text-lg font-semibold ${isOverBudget ? 'text-destructive' : 'text-accent'}`}>
                  {formatCurrency(Math.abs(remaining))}
                </span>
              </div>
              {isOverBudget && (
                <p className="text-xs text-muted-foreground mt-2">
                  You've exceeded your budget by {percentage.toFixed(0)}%
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Set a budget to track your spending</p>
            <Button onClick={() => setIsEditDialogOpen(true)}>
              Set Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
