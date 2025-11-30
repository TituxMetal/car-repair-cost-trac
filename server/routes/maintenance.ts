import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../db/prisma'
import {
  maintenanceEventCreateSchema,
  maintenanceEventUpdateSchema,
  maintenanceEventBulkCreateSchema,
  maintenanceCompleteSchema,
} from '../validators/schemas'

export const maintenanceRouter = new Hono()

// Default weekly checks configuration
const defaultWeeklyChecks = [
  { category: 'oil-level-check', title: 'Weekly Oil Level Check', description: 'Check engine oil level' },
  { category: 'tire-pressure-check', title: 'Weekly Tire Pressure Check', description: 'Check tire pressure when cold' },
  { category: 'coolant-level-check', title: 'Weekly Coolant Level Check', description: 'Check coolant reservoir level' },
  { category: 'brake-fluid-check', title: 'Weekly Brake Fluid Check', description: 'Check brake fluid level' },
  { category: 'windshield-washer-check', title: 'Weekly Washer Fluid Check', description: 'Check washer fluid level' },
  { category: 'lights-check', title: 'Weekly Lights Check', description: 'Check all lights are working' },
]

// Reset and create fresh weekly checks
maintenanceRouter.post('/reset/:vehicleId', async (c) => {
  const vehicleId = c.req.param('vehicleId')
  const today = new Date().toISOString().split('T')[0]
  
  // Delete ALL maintenance events for this vehicle
  await prisma.maintenanceEvent.deleteMany({
    where: { vehicleId },
  })
  
  // Create fresh weekly checks for today
  const checks = defaultWeeklyChecks.map(check => ({
    vehicleId,
    category: check.category,
    type: 'weekly-check',
    title: check.title,
    description: check.description,
    scheduledDate: today,
    status: 'scheduled',
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceValue: 1,
  }))
  
  await prisma.maintenanceEvent.createMany({ data: checks })
  
  return c.json({ 
    message: `Reset complete! Created ${checks.length} fresh checks for ${today}`,
    count: checks.length,
    date: today,
  })
})

// Get all maintenance events (optionally filtered by vehicleId)
maintenanceRouter.get('/', async (c) => {
  const vehicleId = c.req.query('vehicleId')
  
  const events = await prisma.maintenanceEvent.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    orderBy: { scheduledDate: 'asc' },
  })
  
  return c.json(events)
})

// Get maintenance event by ID
maintenanceRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const event = await prisma.maintenanceEvent.findUnique({
    where: { id },
    include: { expenses: true },
  })
  
  if (!event) {
    return c.json({ error: 'Maintenance event not found' }, 404)
  }
  
  return c.json(event)
})

// Create maintenance event
maintenanceRouter.post(
  '/',
  zValidator('json', maintenanceEventCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    
    const event = await prisma.maintenanceEvent.create({
      data,
    })
    
    return c.json(event, 201)
  }
)

// Bulk create maintenance events (for weekly checks)
maintenanceRouter.post(
  '/bulk',
  zValidator('json', maintenanceEventBulkCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    
    const _events = await prisma.maintenanceEvent.createMany({
      data,
    })
    
    // Fetch the created events
    const createdEvents = await prisma.maintenanceEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: data.length,
    })
    
    return c.json(createdEvents, 201)
  }
)

// Update maintenance event
maintenanceRouter.put(
  '/:id',
  zValidator('json', maintenanceEventUpdateSchema),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    
    try {
      const event = await prisma.maintenanceEvent.update({
        where: { id },
        data,
      })
      return c.json(event)
    } catch (_error) {
      return c.json({ error: 'Maintenance event not found' }, 404)
    }
  }
)

// Mark as complete (and auto-create next occurrence for recurring checks)
maintenanceRouter.patch(
  '/:id/complete',
  zValidator('json', maintenanceCompleteSchema),
  async (c) => {
    const id = c.req.param('id')
    const { completedMileage } = c.req.valid('json')
    
    try {
      // Get the current event first
      const currentEvent = await prisma.maintenanceEvent.findUnique({
        where: { id },
      })
      
      if (!currentEvent) {
        return c.json({ error: 'Maintenance event not found' }, 404)
      }
      
      const completedDate = new Date().toISOString().split('T')[0]
      
      // Update to completed
      const event = await prisma.maintenanceEvent.update({
        where: { id },
        data: {
          status: 'completed',
          completedDate,
          completedMileage,
        },
      })
      
      // If recurring, create the next occurrence
      let nextEvent = null
      if (currentEvent.isRecurring && currentEvent.recurrenceType && currentEvent.recurrenceValue) {
        let nextScheduledDate: string | null = null
        let nextScheduledMileage: number | null = null
        
        const today = new Date()
        
        if (currentEvent.recurrenceType === 'weekly') {
          const nextDate = new Date(today)
          nextDate.setDate(nextDate.getDate() + (7 * currentEvent.recurrenceValue))
          nextScheduledDate = nextDate.toISOString().split('T')[0]
        } else if (currentEvent.recurrenceType === 'monthly') {
          const nextDate = new Date(today)
          nextDate.setMonth(nextDate.getMonth() + currentEvent.recurrenceValue)
          nextScheduledDate = nextDate.toISOString().split('T')[0]
        } else if (currentEvent.recurrenceType === 'mileage' && completedMileage) {
          nextScheduledMileage = completedMileage + currentEvent.recurrenceValue
        }
        
        nextEvent = await prisma.maintenanceEvent.create({
          data: {
            vehicleId: currentEvent.vehicleId,
            category: currentEvent.category,
            type: currentEvent.type,
            title: currentEvent.title,
            description: currentEvent.description,
            scheduledDate: nextScheduledDate,
            scheduledMileage: nextScheduledMileage,
            status: 'scheduled',
            isRecurring: true,
            recurrenceType: currentEvent.recurrenceType,
            recurrenceValue: currentEvent.recurrenceValue,
            parentEventId: currentEvent.parentEventId || currentEvent.id, // Link to original
          },
        })
      }
      
      return c.json({ 
        completed: event, 
        next: nextEvent,
        message: nextEvent ? 'Check completed. Next occurrence scheduled.' : 'Check completed.'
      })
    } catch (error) {
      console.error('Complete error:', error)
      return c.json({ error: 'Failed to complete maintenance event' }, 500)
    }
  }
)

// Get upcoming checks (due soon)
maintenanceRouter.get('/upcoming/:vehicleId', async (c) => {
  const vehicleId = c.req.param('vehicleId')
  
  // Get next 14 days (2 weeks to catch weekly checks)
  const nextTwoWeeks = new Date()
  nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14)
  const nextTwoWeeksStr = nextTwoWeeks.toISOString().split('T')[0]
  
  const upcomingChecks = await prisma.maintenanceEvent.findMany({
    where: {
      vehicleId,
      status: 'scheduled',
      // Get all scheduled events within next 2 weeks (or overdue)
      scheduledDate: { lte: nextTwoWeeksStr },
    },
    orderBy: [
      { scheduledDate: 'asc' },
      { title: 'asc' },
    ],
  })
  
  return c.json(upcomingChecks)
})

// Get check history (completed recurring checks grouped by type)
maintenanceRouter.get('/history/:vehicleId', async (c) => {
  const vehicleId = c.req.param('vehicleId')
  
  const completedChecks = await prisma.maintenanceEvent.findMany({
    where: {
      vehicleId,
      status: 'completed',
      isRecurring: true,
    },
    orderBy: { completedDate: 'desc' },
    take: 50, // Last 50 completed checks
  })
  
  return c.json(completedChecks)
})

// Reset all scheduled checks to today (for testing)
maintenanceRouter.post('/reset-to-today/:vehicleId', async (c) => {
  const vehicleId = c.req.param('vehicleId')
  const today = new Date().toISOString().split('T')[0]
  
  const result = await prisma.maintenanceEvent.updateMany({
    where: {
      vehicleId,
      status: 'scheduled',
    },
    data: {
      scheduledDate: today,
    },
  })
  
  return c.json({ 
    message: `Reset ${result.count} checks to ${today}`,
    count: result.count,
    date: today,
  })
})

// Migrate existing weekly checks to be recurring (one-time fix)
maintenanceRouter.post('/migrate-recurring/:vehicleId', async (c) => {
  const vehicleId = c.req.param('vehicleId')
  
  // Update all weekly-check type events to be recurring
  const result = await prisma.maintenanceEvent.updateMany({
    where: {
      vehicleId,
      type: 'weekly-check',
    },
    data: {
      isRecurring: true,
      recurrenceType: 'weekly',
      recurrenceValue: 1,
    },
  })
  
  // Get unique categories from completed checks
  const completedChecks = await prisma.maintenanceEvent.findMany({
    where: {
      vehicleId,
      type: 'weekly-check',
      status: 'completed',
    },
    distinct: ['category'],
  })
  
  // Delete any existing scheduled weekly checks (we'll recreate them)
  await prisma.maintenanceEvent.deleteMany({
    where: {
      vehicleId,
      type: 'weekly-check',
      status: 'scheduled',
    },
  })
  
  // Create fresh checks for next week
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]
  
  const checksToCreate = completedChecks.map(check => ({
    vehicleId: check.vehicleId,
    category: check.category,
    type: check.type,
    title: check.title,
    description: check.description,
    scheduledDate: nextWeekStr,
    status: 'scheduled',
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceValue: 1,
    parentEventId: check.id,
  }))
  
  let createdCount = 0
  if (checksToCreate.length > 0) {
    const created = await prisma.maintenanceEvent.createMany({
      data: checksToCreate,
    })
    createdCount = created.count
  }
  
  return c.json({ 
    message: `Migrated ${result.count} checks, created ${createdCount} new scheduled checks for ${nextWeekStr}`,
    migrated: result.count,
    created: createdCount,
    nextDate: nextWeekStr,
  })
})

// Delete maintenance event
maintenanceRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await prisma.maintenanceEvent.delete({
      where: { id },
    })
    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: 'Maintenance event not found' }, 404)
  }
})
