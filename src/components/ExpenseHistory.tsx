import { useState, useMemo } from 'react'
import { Expense, MaintenanceEvent } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyDollar, MagnifyingGlass, PencilSimple, Trash, Funnel } from '@phosphor-icons/react'

interface ExpenseHistoryProps {
  expenses: Expense[]
  events: MaintenanceEvent[]
  onEdit?: (expense: Expense) => void
  onDelete?: (expenseId: string) => void
}

export const ExpenseHistory = ({ expenses, events, onEdit, onDelete }: ExpenseHistoryProps) => {
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minCost, setMinCost] = useState('')
  const [maxCost, setMaxCost] = useState('')

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const eventTitleMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const event of events) {
      map.set(event.id, event.title)
    }
    return map
  }, [events])

  const getEventTitle = (eventId: string) => eventTitleMap.get(eventId) || 'Unknown Event'

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.totalCost, 0)

  const hasActions = !!(onEdit || onDelete)

  const filteredExpenses = sortedExpenses.filter(expense => {
    const query = search.toLowerCase()
    if (query) {
      const matchesSearch =
        getEventTitle(expense.eventId).toLowerCase().includes(query) ||
        (expense.garageName || '').toLowerCase().includes(query) ||
        (expense.description || '').toLowerCase().includes(query) ||
        formatDate(expense.date).toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    if (dateFrom && expense.date < dateFrom) return false
    if (dateTo && expense.date > dateTo) return false

    const min = minCost !== '' ? parseFloat(minCost) : null
    const max = maxCost !== '' ? parseFloat(maxCost) : null
    if (min !== null && !Number.isNaN(min) && expense.totalCost < min) return false
    if (max !== null && !Number.isNaN(max) && expense.totalCost > max) return false

    return true
  })

  const handleDelete = (expense: Expense) => {
    if (!window.confirm(`Delete expense for "${getEventTitle(expense.eventId)}"?`)) return
    onDelete?.(expense.id)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollar className="text-accent" size={24} />
            <CardTitle>Expense History</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-xl font-semibold text-accent">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            className="pl-9"
            placeholder="Search by event, garage, description or date…"
            aria-label="Search expenses"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters toggle */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(open => !open)}
            className="flex items-center gap-2"
          >
            <Funnel size={16} />
            Filters
          </Button>

          {filtersOpen && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 p-3 rounded-md border border-border bg-muted/20">
              <div className="space-y-1">
                <Label htmlFor="filter-date-from" className="text-xs text-muted-foreground">Date from</Label>
                <Input id="filter-date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="filter-date-to" className="text-xs text-muted-foreground">Date to</Label>
                <Input id="filter-date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="filter-min-cost" className="text-xs text-muted-foreground">Min cost</Label>
                <Input
                  id="filter-min-cost"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0"
                  value={minCost}
                  onChange={e => setMinCost(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="filter-max-cost" className="text-xs text-muted-foreground">Max cost</Label>
                <Input
                  id="filter-max-cost"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="∞"
                  value={maxCost}
                  onChange={e => setMaxCost(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Result count */}
        {expenses.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </p>
        )}

        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollar className="text-muted-foreground mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium mb-2">No expenses recorded</h3>
            <p className="text-muted-foreground">Add expenses to track your maintenance costs</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <MagnifyingGlass className="text-muted-foreground mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium mb-2">No results</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop table */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Garage</TableHead>
                    <TableHead className="text-right">Parts</TableHead>
                    <TableHead className="text-right">Labor</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {hasActions && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{getEventTitle(expense.eventId)}</TableCell>
                      <TableCell>{expense.garageName || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.partsCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.laborCost)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(expense.totalCost)}</TableCell>
                      {hasActions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(expense)}
                                aria-label="Edit expense"
                              >
                                <PencilSimple size={16} />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(expense)}
                                aria-label="Delete expense"
                              >
                                <Trash size={16} className="text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filteredExpenses.map(expense => (
                <Card key={expense.id} className="bg-muted/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{getEventTitle(expense.eventId)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-lg font-semibold text-accent">{formatCurrency(expense.totalCost)}</p>
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(expense)}
                            aria-label="Edit expense"
                          >
                            <PencilSimple size={16} />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense)}
                            aria-label="Delete expense"
                          >
                            <Trash size={16} className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {expense.garageName && (
                      <p className="text-sm text-muted-foreground">{expense.garageName}</p>
                    )}
                    <div className="flex gap-4 text-xs">
                      <span>Parts: {formatCurrency(expense.partsCost)}</span>
                      <span>Labor: {formatCurrency(expense.laborCost)}</span>
                      {expense.otherCost > 0 && (
                        <span>Other: {formatCurrency(expense.otherCost)}</span>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                        {expense.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
