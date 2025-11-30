import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../db/prisma'
import { expenseCreateSchema, expenseUpdateSchema } from '../validators/schemas'

export const expensesRouter = new Hono()

// Get all expenses (optionally filtered by vehicleId or eventId)
expensesRouter.get('/', async (c) => {
  const vehicleId = c.req.query('vehicleId')
  const eventId = c.req.query('eventId')
  
  const expenses = await prisma.expense.findMany({
    where: {
      ...(vehicleId && { vehicleId }),
      ...(eventId && { eventId }),
    },
    orderBy: { date: 'desc' },
  })
  
  return c.json(expenses)
})

// Get expense by ID
expensesRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { event: true },
  })
  
  if (!expense) {
    return c.json({ error: 'Expense not found' }, 404)
  }
  
  return c.json(expense)
})

// Create expense
expensesRouter.post(
  '/',
  zValidator('json', expenseCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    const totalCost = data.partsCost + data.laborCost + data.otherCost
    
    const expense = await prisma.expense.create({
      data: {
        ...data,
        totalCost,
      },
    })
    
    return c.json(expense, 201)
  }
)

// Update expense
expensesRouter.put(
  '/:id',
  zValidator('json', expenseUpdateSchema),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    
    try {
      const existing = await prisma.expense.findUnique({ where: { id } })
      if (!existing) {
        return c.json({ error: 'Expense not found' }, 404)
      }
      
      const partsCost = data.partsCost ?? existing.partsCost
      const laborCost = data.laborCost ?? existing.laborCost
      const otherCost = data.otherCost ?? existing.otherCost
      const totalCost = partsCost + laborCost + otherCost
      
      const expense = await prisma.expense.update({
        where: { id },
        data: {
          ...data,
          totalCost,
        },
      })
      return c.json(expense)
    } catch (_error) {
      return c.json({ error: 'Expense not found' }, 404)
    }
  }
)

// Delete expense
expensesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await prisma.expense.delete({
      where: { id },
    })
    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: 'Expense not found' }, 404)
  }
})

// Get total spending stats for a vehicle
expensesRouter.get('/stats/:vehicleId', async (c) => {
  const vehicleId = c.req.param('vehicleId')
  
  const stats = await prisma.expense.aggregate({
    where: { vehicleId },
    _sum: {
      totalCost: true,
      partsCost: true,
      laborCost: true,
      otherCost: true,
    },
    _count: true,
  })
  
  return c.json({
    totalSpending: stats._sum.totalCost || 0,
    partsCost: stats._sum.partsCost || 0,
    laborCost: stats._sum.laborCost || 0,
    otherCost: stats._sum.otherCost || 0,
    count: stats._count,
  })
})
