import { Expense, MaintenanceEvent } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CurrencyDollar } from '@phosphor-icons/react'

interface ExpenseHistoryProps {
  expenses: Expense[]
  events: MaintenanceEvent[]
}

export const ExpenseHistory = ({ expenses, events }: ExpenseHistoryProps) => {
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const getEventTitle = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    return event?.title || 'Unknown Event'
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.totalCost, 0)

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
      <CardContent>
        {sortedExpenses.length > 0 ? (
          <div className="space-y-3">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{getEventTitle(expense.eventId)}</TableCell>
                      <TableCell>{expense.garageName || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.partsCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.laborCost)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(expense.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="md:hidden space-y-2">
              {sortedExpenses.map(expense => (
                <Card key={expense.id} className="bg-muted/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{getEventTitle(expense.eventId)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                      <p className="text-lg font-semibold text-accent">{formatCurrency(expense.totalCost)}</p>
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
        ) : (
          <div className="text-center py-12">
            <CurrencyDollar className="text-muted-foreground mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium mb-2">No expenses recorded</h3>
            <p className="text-muted-foreground">Add expenses to track your maintenance costs</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
