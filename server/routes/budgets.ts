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

  const start = new Date(budget.startDate)
  const end = new Date(budget.startDate)
  if (budget.period === 'monthly') {
    end.setMonth(end.getMonth() + 1)
  } else if (budget.period === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    return c.json({ error: 'Invalid budget period' }, 500)
  }

  const stats = await prisma.expense.aggregate({
    where: {
      vehicleId,
      date: {
        gte: start.toISOString().split('T')[0],
        lt: end.toISOString().split('T')[0],
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
    
    try {
      const budget = await prisma.budget.update({
        where: { id },
        data,
      })
      return c.json(budget)
    } catch (_error) {
      return c.json({ error: 'Budget not found' }, 404)
    }
  }
)

// Delete budget
budgetsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await prisma.budget.delete({
      where: { id },
    })
    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: 'Budget not found' }, 404)
  }
})
