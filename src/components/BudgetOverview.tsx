import { useState, useEffect } from 'react'
import { Budget } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyDollarIcon, PencilSimpleIcon, WarningIcon } from '@phosphor-icons/react'

const getStartDateForPeriod = (p: 'monthly' | 'yearly'): string => {
  const now = new Date()
  if (p === 'monthly') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  return `${now.getFullYear()}-01-01`
}

interface BudgetOverviewProps {
  budget?: Budget & { currentSpending?: number }
  onUpdateBudget: (budget: Budget) => void
}

export const BudgetOverview = ({ budget, onUpdateBudget }: BudgetOverviewProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [amount, setAmount] = useState(budget?.amount || 1000)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(budget?.period || 'yearly')

  useEffect(() => {
    if (budget) {
      setAmount(budget.amount)
      setPeriod(budget.period)
    }
  }, [budget])

  const handleSave = () => {
    const startDate = period !== budget?.period
      ? getStartDateForPeriod(period)
      : budget?.startDate || new Date().toISOString()
    onUpdateBudget({
      id: budget?.id || `budget-${Date.now()}`,
      vehicleId: budget?.vehicleId || '',
      amount,
      period,
      startDate
    })
    setIsEditDialogOpen(false)
  }

  const handlePeriodToggle = (newPeriod: 'monthly' | 'yearly') => {
    if (!budget || newPeriod === budget.period) return
    const scaledAmount = newPeriod === 'yearly'
      ? Math.round(budget.amount * 12 * 100) / 100
      : Math.round((budget.amount / 12) * 100) / 100
    setPeriod(newPeriod)
    setAmount(scaledAmount)
    onUpdateBudget({ ...budget, amount: scaledAmount, period: newPeriod, startDate: getStartDateForPeriod(newPeriod) })
  }

  const currentPeriod = period
  const spending = budget?.currentSpending ?? 0
  const budgetAmount = budget?.amount || 0
  const rawPercentage = budgetAmount > 0 ? (spending / budgetAmount) * 100 : 0
  const percentage = Math.min(rawPercentage, 100)
  const remaining = budgetAmount - spending
  const isOverBudget = spending > budgetAmount

  const getProgressColor = (): string => {
    if (rawPercentage >= 100) return '[&_[data-slot=progress-indicator]]:bg-destructive'
    if (rawPercentage >= 80) return '[&_[data-slot=progress-indicator]]:bg-amber-500'
    return '[&_[data-slot=progress-indicator]]:bg-green-500'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="text-accent" size={24} />
            <CardTitle>Budget Overview</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {budget && (
              <div className="flex rounded-md border border-border overflow-hidden text-xs">
                <button
                  type="button"
                  aria-pressed={currentPeriod === 'monthly'}
                  onClick={() => handlePeriodToggle('monthly')}
                  className={`px-3 py-2 min-h-11 cursor-pointer transition-colors ${currentPeriod === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  aria-pressed={currentPeriod === 'yearly'}
                  onClick={() => handlePeriodToggle('yearly')}
                  className={`px-3 py-2 min-h-11 cursor-pointer transition-colors ${currentPeriod === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  Yearly
                </button>
              </div>
            )}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <PencilSimpleIcon size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <div className="border-b border-border px-6 py-5 bg-card">
                  <h2 className="text-2xl font-semibold">Set Budget</h2>
                  <p className="text-sm text-muted-foreground mt-1">Define your maintenance budget</p>
                </div>
                <div className="p-6 space-y-5">
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
                  <div className="pt-2 border-t border-border">
                    <Button onClick={handleSave} className="w-full h-11" size="lg">
                      Save Budget
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          {budget ? `${currentPeriod === 'yearly' ? 'Annual' : 'Monthly'} maintenance budget` : 'No budget set'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {budget ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">{formatCurrency(spending)}</span>
              </div>
              <div className={getProgressColor()}>
                <Progress value={percentage} className="h-3" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">{formatCurrency(budgetAmount)}</span>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isOverBudget ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOverBudget && <WarningIcon className="text-destructive" size={20} />}
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
                  You've exceeded your budget by {Math.max(rawPercentage - 100, 0).toFixed(0)}%
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
