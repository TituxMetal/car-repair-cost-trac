import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../db/prisma'
import { budgetCreateSchema, budgetUpdateSchema } from '../validators/schemas'

export const budgetsRouter = new Hono()

// Get budget for a vehicle
budgetsRouter.get('/:vehicleId', async (c) => {
  const vehicleId = c.req.param('vehicleId')
  
  const budget = await prisma.budget.findUnique({
    where: { vehicleId },
  })
  
  if (!budget) {
    return c.json({ error: 'Budget not found' }, 404)
  }

  const normalized = budget.startDate.slice(0, 10)
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return c.json({ error: 'Invalid budget startDate in database' }, 500)
  }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const day = parseInt(match[3], 10)
  if (month < 1 || month > 12) {
    return c.json({ error: 'Invalid month in budget startDate' }, 500)
  }
  if (day < 1 || day > 31) {
    return c.json({ error: 'Invalid day in budget startDate' }, 500)
  }
  const maxDay = new Date(year, month, 0).getDate()
  if (day > maxDay) {
    return c.json({ error: 'Invalid day for given month in budget startDate' }, 500)
  }

  let startGte: string
  let endLt: string
  if (budget.period !== 'monthly' && budget.period !== 'yearly') {
    return c.json({ error: 'Invalid budget period' }, 500)
  }

  if (budget.period === 'monthly') {
    startGte = `${year}-${String(month).padStart(2, '0')}-01`
    const endYear = month === 12 ? year + 1 : year
    const endMonth = month === 12 ? 1 : month + 1
    endLt = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
  }

  if (budget.period === 'yearly') {
    startGte = `${year}-01-01`
    endLt = `${year + 1}-01-01`
  }

  const stats = await prisma.expense.aggregate({
    where: {
      vehicleId,
      date: {
        gte: startGte,
        lt: endLt,
      },
    },
    _sum: { totalCost: true },
  })

  return c.json({
    ...budget,
    currentSpending: stats._sum.totalCost || 0,
  })
})

// Create or update budget (upsert)
budgetsRouter.post(
  '/',
  zValidator('json', budgetCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    
    const budget = await prisma.budget.upsert({
      where: { vehicleId: data.vehicleId },
      update: {
        amount: data.amount,
        period: data.period,
        startDate: data.startDate,
      },
      create: data,
    })
    
    return c.json(budget, 201)
  }
)

// Update budget
budgetsRouter.put(
  '/:id',
  zValidator('json', budgetUpdateSchema),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    
    const existing = await prisma.budget.findUnique({ where: { id } })
    if (!existing) {
      return c.json({ error: 'Budget not found' }, 404)
    }

    const budget = await prisma.budget.update({
      where: { id },
      data,
    })
    return c.json(budget)
  }
)

// Delete budget
budgetsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  const existing = await prisma.budget.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: 'Budget not found' }, 404)
  }

  await prisma.budget.delete({
    where: { id },
  })
  return c.json({ success: true })
})
