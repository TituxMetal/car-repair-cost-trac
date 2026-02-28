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
  const period = c.req.query('period')
  const startDate = c.req.query('startDate')

  let dateFilter: { gte: string; lt: string } | undefined

  if ((period && !startDate) || (!period && startDate)) {
    return c.json({ error: 'Both period and startDate are required together' }, 400)
  }

  if (period && startDate) {
    if (period !== 'monthly' && period !== 'yearly') {
      return c.json({ error: 'Invalid period. Must be monthly or yearly' }, 400)
    }
    const normalized = startDate.slice(0, 10)
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) {
      return c.json({ error: 'Invalid startDate. Must be YYYY-MM-DD' }, 400)
    }
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const day = parseInt(match[3], 10)
    if (month < 1 || month > 12) {
      return c.json({ error: 'Invalid month in startDate' }, 400)
    }
    if (day < 1 || day > 31) {
      return c.json({ error: 'Invalid day in startDate' }, 400)
    }
    const maxDay = new Date(year, month, 0).getDate()
    if (day > maxDay) {
      return c.json({ error: 'Invalid day for given month in startDate' }, 400)
    }

    let startGte: string
    let endLt: string
    if (period === 'monthly') {
      startGte = `${year}-${String(month).padStart(2, '0')}-01`
      const endYear = month === 12 ? year + 1 : year
      const endMonth = month === 12 ? 1 : month + 1
      endLt = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
    } else {
      startGte = `${year}-01-01`
      endLt = `${year + 1}-01-01`
    }

    dateFilter = { gte: startGte, lt: endLt }
  }

  const stats = await prisma.expense.aggregate({
    where: {
      vehicleId,
      ...(dateFilter && { date: dateFilter }),
    },
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
